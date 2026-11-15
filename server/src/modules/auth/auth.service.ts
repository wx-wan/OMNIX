import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { ContactType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string; // 头像路径；未设置时用默认头像
  createdAt: string; // ISO 字符串，成员页「已加入」列展示真实创建时间
  presence: string; // 在线状态：online | away | busy | offline
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    email: string,
    name: string,
    password: string,
  ): Promise<PublicUser> {
    const existing = await this.prisma.contact.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.contact.create({
      data: {
        email,
        name,
        type: ContactType.user,
        role: "user",
        password: passwordHash,
      },
    });
    return this.toPublic(user);
  }

  async validateUser(email: string, password: string): Promise<PublicUser> {
    const user = await this.prisma.contact.findUnique({ where: { email } });
    if (!user || user.type !== ContactType.user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    return this.toPublic(user);
  }

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.contact.findUnique({ where: { id } });
    return user ? this.toPublic(user) : null;
  }

  async updateProfile(
    id: string,
    patch: { name?: string; avatarUrl?: string },
  ): Promise<PublicUser> {
    const user = await this.prisma.contact.update({
      where: { id },
      data: patch,
    });
    return this.toPublic(user);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.contact.findUnique({ where: { id } });
    if (!user || user.type !== ContactType.user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    await this.prisma.contact.update({
      where: { id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });
  }

  /**
   * 忘记密码：生成一次性重置码写入 Setting KV（15 分钟有效）。
   * 演示环境未配置 SMTP，故不依赖邮件投递，直接由前端展示重置码。
   */
  async requestPasswordReset(email: string): Promise<{ token: string }> {
    const user = await this.prisma.contact.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        type: ContactType.user,
        password: { not: null },
        isSystem: false,
        archived: false,
      },
    });
    if (!user) throw new NotFoundException("该邮箱没有注册账号");

    const token = randomBytes(16).toString("hex");
    const value = JSON.stringify({
      email: user.email,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    await this.prisma.setting.upsert({
      where: { key: `auth.reset.${token}` },
      update: { value },
      create: { key: `auth.reset.${token}`, value },
    });
    return { token };
  }

  /** 用重置码设置新密码；成功后立即失效，防止重复使用。 */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const key = `auth.reset.${token}`;
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (!row) throw new BadRequestException("重置码无效或已使用");

    const { email, expiresAt } = JSON.parse(row.value) as {
      email: string;
      expiresAt: number;
    };
    if (Date.now() > expiresAt) {
      await this.prisma.setting.delete({ where: { key } });
      throw new BadRequestException("重置码已过期，请重新获取");
    }
    const user = await this.prisma.contact.findFirst({
      where: { email, type: ContactType.user, isSystem: false, archived: false },
    });
    if (!user) throw new BadRequestException("重置码无效");

    await this.prisma.contact.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });
    await this.prisma.setting.delete({ where: { key } });
  }

  /** 成员列表：只返回可登录的真实账号（排除系统机器人、服务号、归档账号）。 */
  async listUsers(): Promise<PublicUser[]> {
    const rows = await this.prisma.contact.findMany({
      where: {
        type: ContactType.user,
        password: { not: null },
        isSystem: false,
        archived: false,
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => this.toPublic(row));
  }

  /** 改角色属于敏感操作，仅管理员可执行。 */
  async requireAdmin(userId: string): Promise<void> {
    const actor = await this.prisma.contact.findUnique({ where: { id: userId } });
    if (!actor || actor.type !== ContactType.user || actor.role !== "admin" || actor.isSystem || actor.archived) {
      throw new ForbiddenException("Admin only");
    }
  }

  async updateUserRole(id: string, role: string): Promise<PublicUser> {
    if (!["admin", "user", "viewer"].includes(role)) {
      throw new BadRequestException("Invalid role");
    }
    const user = await this.prisma.contact.findUnique({ where: { id } });
    if (!user || user.type !== ContactType.user || user.isSystem || user.archived) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.toPublic(await this.prisma.contact.update({ where: { id }, data: { role } }));
  }

  /** 移除成员用归档而非硬删：Contact 被 Deal / Quotation 等外键引用，硬删会失败。 */
  async archiveUser(id: string): Promise<void> {
    const user = await this.prisma.contact.findUnique({ where: { id } });
    if (!user || user.type !== ContactType.user || user.isSystem || user.archived) {
      throw new NotFoundException(`User ${id} not found`);
    }
    await this.prisma.contact.update({ where: { id }, data: { archived: true } });
  }

  private toPublic(user: {
    id: string;
    email: string | null;
    name: string;
    role: string | null;
    avatarUrl?: string | null;
    createdAt: Date;
    presence?: string | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email ?? "",
      name: user.name,
      role: user.role ?? "user",
      avatarUrl: user.avatarUrl || "/images/profile/user-1.png",
      createdAt: user.createdAt.toISOString(),
      presence: user.presence ?? "offline",
    };
  }
}
