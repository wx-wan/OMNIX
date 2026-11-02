import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * 极简 OAuth 2.0 授权服务器（Authorization Code + PKCE），供 MCP 客户端
 * （如 Accio Work）走标准「在浏览器中授权」流程，而不是手工填 Bearer 头。
 *
 * 持久化层（oauth_tokens 表）：
 * - access_token 用于鉴权；refresh_token 用于静默续期（避免每小时重授权）。
 * - 存在未过期的 refresh 即代表「该用户已授权过该客户端」，授权端点据此自动放行，
 *   跳过「允许授权」手动点击（仅首次需确认一次）。
 * - 授权码（code）仍是一次性、短时效，存内存即可（5 分钟，且重跑代价极低）。
 */
interface CodeRecord {
  userId: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge?: string;
  expiresAt: number;
}

const CODE_TTL = 5 * 60 * 1000; // 授权码 5 分钟有效
const ACCESS_TTL = 60 * 60 * 1000; // access_token 1 小时有效
const REFRESH_TTL = 30 * 24 * 60 * 60 * 1000; // refresh_token 30 天有效

@Injectable()
export class OauthService {
  private readonly codes = new Map<string, CodeRecord>();
  constructor(private readonly prisma: PrismaService) {}

  /** 发放一次性授权码。 */
  issueAuthCode(p: {
    userId: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    codeChallenge?: string;
  }): string {
    const code = randomBytes(24).toString("hex");
    this.codes.set(code, {
      userId: p.userId,
      clientId: p.clientId,
      redirectUri: p.redirectUri,
      scope: p.scope,
      codeChallenge: p.codeChallenge,
      expiresAt: Date.now() + CODE_TTL,
    });
    return code;
  }

  /** 用授权码兑换 access_token + refresh_token（校验 redirect_uri 与 PKCE）。 */
  async exchangeCode(p: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const rec = this.codes.get(p.code);
    if (!rec || rec.expiresAt < Date.now()) {
      this.codes.delete(p.code);
      throw new UnauthorizedException("invalid_grant: code 无效或已过期");
    }
    if (rec.redirectUri !== p.redirectUri) {
      throw new UnauthorizedException("invalid_grant: redirect_uri 不匹配");
    }
    if (!verifyPkce(rec.codeChallenge, p.codeVerifier)) {
      throw new UnauthorizedException("invalid_grant: PKCE 校验失败");
    }
    this.codes.delete(p.code); // 一次性
    const { accessToken, refreshToken } = await this.issueTokenPair(
      rec.userId,
      rec.clientId,
      rec.scope,
    );
    return { accessToken, refreshToken, expiresIn: ACCESS_TTL / 1000 };
  }

  /** refresh_token 授权：校验并轮换一对新令牌（旧 refresh 作废）。 */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const rec = await this.prisma.oAuthToken.findUnique({ where: { refreshToken } });
    if (!rec || rec.refreshExpiresAt < new Date()) {
      if (rec) await this.prisma.oAuthToken.delete({ where: { id: rec.id } }).catch(() => undefined);
      throw new UnauthorizedException("invalid_grant: refresh token 无效或已过期");
    }
    const now = new Date();
    const accessToken = randomBytes(32).toString("hex");
    const newRefresh = randomBytes(32).toString("hex");
    await this.prisma.oAuthToken.update({
      where: { id: rec.id },
      data: {
        accessToken,
        refreshToken: newRefresh,
        accessExpiresAt: new Date(now.getTime() + ACCESS_TTL),
        refreshExpiresAt: new Date(now.getTime() + REFRESH_TTL),
      },
    });
    return { accessToken, refreshToken: newRefresh, expiresIn: ACCESS_TTL / 1000 };
  }

  /** 校验 access_token，返回关联 userId；无效/过期返回 null。 */
  async validateAccessToken(token: string): Promise<string | null> {
    const rec = await this.prisma.oAuthToken.findUnique({ where: { accessToken: token } });
    if (!rec) return null;
    if (rec.accessExpiresAt < new Date()) return null;
    return rec.userId;
  }

  /** 是否曾授权过（存在未过期的 refresh）：用于授权端点自动跳过确认页。 */
  async hasConsent(userId: string, clientId: string, scope: string): Promise<boolean> {
    const rec = await this.prisma.oAuthToken.findFirst({
      where: { userId, clientId, scope, refreshExpiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return !!rec;
  }

  /** 动态客户端注册（RFC 7591 最小实现）。 */
  registerClient(): { client_id: string } {
    return { client_id: "omnix-mcp" };
  }

  /** 生成并持久化一对新令牌。 */
  private async issueTokenPair(
    userId: string,
    clientId: string,
    scope: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const now = Date.now();
    const accessToken = randomBytes(32).toString("hex");
    const refreshToken = randomBytes(32).toString("hex");
    await this.prisma.oAuthToken.create({
      data: {
        userId,
        clientId,
        scope,
        accessToken,
        refreshToken,
        accessExpiresAt: new Date(now + ACCESS_TTL),
        refreshExpiresAt: new Date(now + REFRESH_TTL),
      },
    });
    return { accessToken, refreshToken };
  }
}

/** S256 PKCE 校验：无 challenge 时放行（兼容未启用 PKCE 的客户端）。 */
function verifyPkce(challenge: string | undefined, verifier?: string): boolean {
  if (!challenge) return true;
  if (!verifier) return false;
  const hash = createHash("sha256").update(verifier).digest("base64url");
  return hash === challenge;
}
