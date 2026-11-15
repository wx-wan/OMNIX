import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ContactType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * 成员守卫：当前会话必须是「系统已注册的可登录用户」。
 * 在全局 session AuthGuard 之上进一步排除系统机器人、服务号与归档账号，
 * 供联系人等需要成员身份的写接口使用。
 */
@Injectable()
export class MemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      session?: { userId?: string };
    }>();
    const userId = req.session?.userId;
    if (!userId) return false;
    const user = await this.prisma.contact.findUnique({ where: { id: userId } });
    if (
      !user ||
      user.type !== ContactType.user ||
      !user.password ||
      user.isSystem ||
      user.archived
    ) {
      throw new ForbiddenException("Members only");
    }
    return true;
  }
}
