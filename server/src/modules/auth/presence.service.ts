import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import { ContactType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/** 在线状态：登录态 / 长时间无操作自动离开 / 用户手动请勿打扰 / 离线。 */
export type PresenceStatus = "online" | "away" | "busy" | "offline";

const STATUS_SET: PresenceStatus[] = ["online", "away", "busy", "offline"];

/** 超过该时长没有活动上报 → 自动置为 away（用户手动 busy 不受影响）。 */
const IDLE_AWAY_MS = 5 * 60 * 1000;
/** 超过该时长没有活动上报 → 视为离线（浏览器关闭、断网等无法主动上报的情况）。 */
const IDLE_OFFLINE_MS = 15 * 60 * 1000;

export interface PresenceEntry {
  id: string;
  status: PresenceStatus;
  lastActiveAt: string | null;
}

export interface PresenceEvent {
  data: PresenceEntry[];
}

/** SSE message 事件（Nest @Sse 会把 data 序列化到 SSE 帧）。 */
export interface SseMessage {
  data: string;
}

/**
 * 在线状态由后端统一维护：
 * - 登录成功 → online
 * - 用户手动切换 → busy / online（或任意指定状态）
 * - 前端活动心跳 → 刷新 lastActiveAt，并把 away 恢复为 online
 * - 定时巡检 → 长时间无活动自动 away / offline
 * - 登出 → offline
 * 每次变更通过 SSE 广播给所有已连接的应用端，实现多端同步。
 */
@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly changes = new Subject<PresenceEntry[]>();
  private readonly interval: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
    this.interval = setInterval(() => {
      void this.sweepIdle();
    }, 30 * 1000);
  }

  onModuleDestroy() {
    clearInterval(this.interval);
    this.changes.complete();
  }

  /** 当前所有可登录成员的状态快照。 */
  async snapshot(): Promise<PresenceEntry[]> {
    const rows = await this.prisma.contact.findMany({
      where: {
        type: ContactType.user,
        password: { not: null },
        isSystem: false,
        archived: false,
      },
      select: { id: true, presence: true, lastActiveAt: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      status: this.normalize(row.presence),
      lastActiveAt: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
    }));
  }

  /** SSE 流：连接时先推全量快照，此后每次变更推全量快照。 */
  stream(): Observable<SseMessage> {
    return new Observable<SseMessage>((subscriber) => {
      void this.snapshot().then((entries) =>
        subscriber.next({ data: JSON.stringify(entries) }),
      );
      const sub = this.changes.subscribe((entries) =>
        subscriber.next({ data: JSON.stringify(entries) }),
      );
      return () => sub.unsubscribe();
    });
  }

  async setStatus(userId: string, status: PresenceStatus): Promise<PresenceEntry[]> {
    await this.prisma.contact.update({
      where: { id: userId },
      data: {
        presence: status,
        // 手动切换也刷新活动时间，避免刚切换就被空闲巡检误判为离开。
        lastActiveAt: new Date(),
      },
    });
    return this.broadcast();
  }

  /** 前端活动心跳：刷新活动时间；若当前是自动 away 则恢复 online（busy 保持）。 */
  async heartbeat(userId: string): Promise<PresenceEntry[]> {
    const user = await this.prisma.contact.findUnique({
      where: { id: userId },
      select: { presence: true },
    });
    if (!user) return this.broadcast();

    const current = this.normalize(user.presence);
    await this.prisma.contact.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
        presence: current === "away" || current === "offline" ? "online" : undefined,
      },
    });
    return this.broadcast();
  }

  /** 定时巡检：长时间无活动自动 away / offline，手动 busy 不受影响。 */
  private async sweepIdle(): Promise<void> {
    const now = Date.now();
    const awayBefore = new Date(now - IDLE_AWAY_MS);
    const offlineBefore = new Date(now - IDLE_OFFLINE_MS);

    // 只有登录态 online 会因短时空闲自动转 away；手动 busy 保持不打扰。
    const active = await this.prisma.contact.updateMany({
      where: {
        type: ContactType.user,
        presence: "online",
        OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: awayBefore } }],
      },
      data: { presence: "away" },
    });

    // 超过更长阈值仍无活动（如浏览器直接关闭）则统一离线，手动 busy 也不例外。
    const offline = await this.prisma.contact.updateMany({
      where: {
        type: ContactType.user,
        presence: { in: ["online", "away", "busy"] },
        OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: offlineBefore } }],
      },
      data: { presence: "offline" },
    });

    if (active.count || offline.count) await this.broadcast();
  }

  private async broadcast(): Promise<PresenceEntry[]> {
    const entries = await this.snapshot();
    this.changes.next(entries);
    return entries;
  }

  private normalize(value: string): PresenceStatus {
    return STATUS_SET.includes(value as PresenceStatus)
      ? (value as PresenceStatus)
      : "offline";
  }
}
