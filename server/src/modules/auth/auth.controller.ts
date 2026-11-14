import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const user = await this.auth.register(dto.email, dto.name, dto.password);
    req.session.userId = user.id;
    return user;
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    req.session.userId = user.id;
    return user;
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response) {
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

  @Patch("me")
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException("Not authenticated");
    return this.auth.updateProfile(userId, dto.name);
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
