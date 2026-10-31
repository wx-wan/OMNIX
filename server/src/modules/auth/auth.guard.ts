import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

/** 全局守卫：未登录访问受保护接口返回 401；/auth 与 /health 白名单放行。 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.method === "OPTIONS") return true;
    const url = req.url || "";
    if (url.startsWith("/auth") || url === "/health") return true;
    if (!req.session?.userId) {
      throw new UnauthorizedException("Not authenticated");
    }
    return true;
  }
}
