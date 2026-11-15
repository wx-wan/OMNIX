import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { PresenceService } from "./presence.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly presence: PresenceService,
  ) {}

  /** 会话 cookie 默认 7 天；「记住此设备」延长到 30 天，未勾选则改为浏览器会话 cookie。 */
  private applyRemember(req: Request, remember: boolean) {
    // express-session 的 maxAge setter 会同步更新 expires：undefined 表示不下发
    // Expires/Max-Age，浏览器关闭即失效；数值则落 Postgres session 并持久化。
    req.session.cookie.maxAge = remember
      ? 1000 * 60 * 60 * 24 * 30
      : undefined;
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const user = await this.auth.register(dto.email, dto.name, dto.password);
    req.session.userId = user.id;
    this.applyRemember(req, false);
    await this.presence.setStatus(user.id, "online");
    return user;
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    req.session.userId = user.id;
    this.applyRemember(req, dto.remember === true);
    await this.presence.setStatus(user.id, "online");
    return user;
  }

  /** 忘记密码：免登录；演示环境把重置码直接返回给前端展示。 */
  @Post("forgot-password")
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  /** 用一次性重置码设置新密码，成功后重定向登录。 */
  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
    return { ok: true };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response) {
    const userId = req.session.userId;
    if (userId) await this.presence.setStatus(userId, "offline");
    req.session.destroy(() => {});
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  }

  @Get("me")
  async me(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException("Not authenticated");
    const user = await this.auth.findById(userId);
    if (!user) throw new UnauthorizedException("Not authenticated");
    return user;
  }

  /** 成员列表：任意登录用户可读（全局 session 守卫保护）。 */
  @Get("users")
  listUsers() {
    return this.auth.listUsers();
  }

  /** 改角色 / 移除成员仅管理员可执行。 */
  @Patch("users/:id")
  async updateUser(
    @Param("id") id: string,
    @Body() dto: { role: string },
    @Req() req: Request,
  ) {
    await this.auth.requireAdmin(req.session.userId!);
    return this.auth.updateUserRole(id, dto.role);
  }

  @Delete("users/:id")
  @HttpCode(204)
  async removeUser(@Param("id") id: string, @Req() req: Request) {
    await this.auth.requireAdmin(req.session.userId!);
    await this.auth.archiveUser(id);
  }

  @Patch("me")
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException("Not authenticated");
    return this.auth.updateProfile(userId, dto);
  }

  @Patch("password")
  @HttpCode(200)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException("Not authenticated");
    await this.auth.changePassword(userId, dto.currentPassword, dto.newPassword);
    return { ok: true };
  }
}
