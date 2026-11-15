import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Sse,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { PresenceService, type PresenceEntry, type SseMessage } from "./presence.service";
import { SetPresenceDto } from "./dto/set-presence.dto";

/**
 * 在线状态由后端统一维护并通过 SSE 广播给所有应用端。
 * 所有端点都需要登录（全局 session 守卫保护）。
 */
@Controller("presence")
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  /** SSE 长连接：任一用户状态变化时，向所有连接端推送全量快照。 */
  @Sse("stream")
  stream(@Req() req: Request): Observable<SseMessage> {
    if (!req.session.userId) throw new UnauthorizedException("Not authenticated");
    return this.presence.stream();
  }

  /** 首次渲染 / 断线重连兜底：拉取当前全量状态。 */
  @Get()
  snapshot(): Promise<PresenceEntry[]> {
    return this.presence.snapshot();
  }

  /** 用户在侧弹手动切换自己的状态（如「请勿打扰」）。 */
  @Patch("me")
  setStatus(
    @Body() dto: SetPresenceDto,
    @Req() req: Request,
  ): Promise<PresenceEntry[]> {
    if (!req.session.userId) throw new UnauthorizedException("Not authenticated");
    return this.presence.setStatus(req.session.userId, dto.status);
  }

  /** 前端活动心跳：刷新活动时间，自动从 away 恢复 online。 */
  @Post("heartbeat")
  @HttpCode(200)
  heartbeat(@Req() req: Request): Promise<PresenceEntry[]> {
    if (!req.session.userId) throw new UnauthorizedException("Not authenticated");
    return this.presence.heartbeat(req.session.userId);
  }
}
