import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "../auth/auth.service";
import { OauthService } from "./oauth.service";

const APP_NAME = "OMNIX";

/** 把授权请求的原始参数回传成隐藏字段 / query。 */
function authParams(q: Record<string, any>) {
  const keys = [
    "response_type",
    "client_id",
    "redirect_uri",
    "scope",
    "state",
    "code_challenge",
    "code_challenge_method",
  ] as const;
  return keys
    .filter((k) => q[k] != null)
    .map((k) => `${k}=${encodeURIComponent(String(q[k]))}`)
    .join("&");
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} · ${APP_NAME}</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;
       background:radial-gradient(1200px 600px at 50% -10%,#2b2b2b,#111);color:#eee;min-height:100vh;
       display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#1c1c1c;border:1px solid #333;border-radius:16px;padding:28px 26px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  h1{font-size:18px;margin:0 0 4px}
  p.sub{margin:0 0 18px;color:#9a9a9a;font-size:13px;line-height:1.5}
  label{display:block;font-size:13px;margin:12px 0 6px;color:#cfcfcf}
  input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #3a3a3a;
        background:#121212;color:#fff;font-size:14px}
  input:focus{outline:none;border-color:#FFD54F}
  button{margin-top:18px;width:100%;padding:11px 14px;border:0;border-radius:10px;cursor:pointer;
         background:#FFD54F;color:#1a1a1a;font-weight:600;font-size:14px}
  button:hover{filter:brightness(1.05)}
  .err{color:#ff8080;font-size:13px;margin-top:12px}
  .scope{background:#121212;border:1px solid #333;border-radius:10px;padding:10px 12px;font-size:13px;color:#cfcfcf;margin:14px 0}
  code{color:#FFD54F}
</style></head><body><div class="card">${body}</div></body></html>`;
}

@Controller()
export class OauthController {
  constructor(
    private readonly oauth: OauthService,
    private readonly auth: AuthService,
  ) {}

  /** OAuth 授权服务器元数据（MCP 客户端发现用）。 */
  @Get(".well-known/oauth-authorization-server")
  metadata(@Req() req: Request) {
    // 经 Vite 反代时 Host 会被改写成后端地址，故优先取 x-forwarded-host，
    // 使 issuer/端点跟随用户实际访问的源（localhost 或局域网 IP）。
    const host = req.get("x-forwarded-host") || req.get("host");
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const origin = `${proto}://${host}`;
    return {
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/oauth/token`,
      registration_endpoint: `${origin}/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      scopes_supported: ["mcp"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    };
  }

  /**
   * 受保护资源元数据（RFC 9728，MCP 授权规范第一步）。
   * 客户端连接 /mcp 收到 401 后，按路径感知规则先取
   * /.well-known/oauth-protected-resource/mcp，再回退 /.well-known/oauth-protected-resource，
   * 其中的 authorization_servers 指向授权服务器，缺它客户端会报
   * "Protected Resource Metadata has no authorization_servers"。
   */
  @Get([".well-known/oauth-protected-resource", ".well-known/oauth-protected-resource/mcp"])
  resourceMetadata(@Req() req: Request) {
    const host = req.get("x-forwarded-host") || req.get("host");
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const origin = `${proto}://${host}`;
    return {
      resource: `${origin}/mcp`,
      resource_documentation: `${origin}/`,
      authorization_servers: [origin],
      scopes_supported: ["mcp"],
      bearer_methods_supported: ["header"],
    };
  }

  /** 动态客户端注册（RFC 7591）。 */
  @Post("oauth/register")
  register() {
    return this.oauth.registerClient();
  }

  /** 授权端点（GET）：未登录→登录页；已登录→确认授权页（回头用户自动放行）。 */
  @Get("oauth/authorize")
  async authorizeGet(@Req() req: Request, @Res() res: Response, @Query() q: Record<string, any>) {
    if (q.response_type !== "code" || !q.client_id || !q.redirect_uri) {
      return this.sendError(res, "invalid_request：缺少必要参数");
    }
    const userId = (req.session as { userId?: string })?.userId;
    const params = authParams(q);
    if (!userId) {
      const html = page(
        "登录并授权",
        `<h1>登录 ${APP_NAME}</h1>
         <p class="sub">登录后即可将 ${APP_NAME} 授权给 MCP 客户端（如 Accio Work）使用。</p>
         <form method="POST" action="/oauth/authorize/login">
           <input type="hidden" name="params" value="${params}"/>
           <label>邮箱</label><input name="email" type="email" required autofocus/>
           <label>密码</label><input name="password" type="password" required/>
           <button type="submit">登录并继续</button>
         </form>`,
      );
      return res.type("html").send(html);
    }
    const clientId = q.client_id ?? "";
    const scope = (q.scope as string) || "mcp";
    // 已授权过（存在未过期的 refresh）→ 自动放行，跳过「允许授权」手动点击，
    // 直接发放 code 并跳回（仅首次授权需手动确认一次）。
    if (await this.oauth.hasConsent(userId, clientId, scope)) {
      const code = this.oauth.issueAuthCode({
        userId,
        clientId,
        redirectUri: (q.redirect_uri as string) ?? "",
        scope,
        codeChallenge: q.code_challenge as string | undefined,
      });
      const redirectUri = (q.redirect_uri as string) ?? "";
      const state = (q.state as string) ?? "";
      const sep = redirectUri.includes("?") ? "&" : "?";
      return res.redirect(`${redirectUri}${sep}code=${code}&state=${encodeURIComponent(state)}`);
    }
    const html = page(
      "确认授权",
      `<h1>授权 ${APP_NAME} 给 MCP 客户端</h1>
       <p class="sub">该客户端将能以你的身份调用 ${APP_NAME} 的 MCP 工具（新建/查询商机等）。</p>
       <div class="scope">授权范围：<code>${q.scope || "mcp"}</code></div>
       <form method="POST" action="/oauth/authorize/consent">
         <input type="hidden" name="params" value="${params}"/>
         <button type="submit">允许授权</button>
       </form>`,
    );
    return res.type("html").send(html);
  }

  /** 授权端点：登录提交。 */
  @Post("oauth/authorize/login")
  async authorizeLogin(@Req() req: Request, @Res() res: Response) {
    const { email, password, params } = req.body as {
      email?: string;
      password?: string;
      params?: string;
    };
    try {
      const user = await this.auth.validateUser(email ?? "", password ?? "");
      (req.session as { userId?: string }).userId = user.id;
      // 登录成功 → 回到授权确认页（带上原始请求参数）
      return res.redirect(`/oauth/authorize?${params ?? ""}`);
    } catch {
      const html = page(
        "登录并授权",
        `<h1>登录 ${APP_NAME}</h1>
         <p class="sub">登录后即可将 ${APP_NAME} 授权给 MCP 客户端使用。</p>
         <form method="POST" action="/oauth/authorize/login">
           <input type="hidden" name="params" value="${params ?? ""}"/>
           <label>邮箱</label><input name="email" type="email" required value="${email ?? ""}" autofocus/>
           <label>密码</label><input name="password" type="password" required/>
           <button type="submit">登录并继续</button>
           <div class="err">邮箱或密码错误</div>
         </form>`,
      );
      return res.type("html").status(401).send(html);
    }
  }

  /** 授权端点：确认授权 → 发放 code 并跳回 redirect_uri。 */
  @Post("oauth/authorize/consent")
  authorizeConsent(@Req() req: Request, @Res() res: Response) {
    const userId = (req.session as { userId?: string })?.userId;
    if (!userId) return res.redirect("/oauth/authorize");
    const params = new URLSearchParams((req.body as { params?: string })?.params ?? "");
    const redirectUri = params.get("redirect_uri") ?? "";
    const state = params.get("state") ?? "";
    const code = this.oauth.issueAuthCode({
      userId,
      clientId: params.get("client_id") ?? "",
      redirectUri,
      scope: params.get("scope") ?? "mcp",
      codeChallenge: params.get("code_challenge") ?? undefined,
    });
    const sep = redirectUri.includes("?") ? "&" : "?";
    return res.redirect(`${redirectUri}${sep}code=${code}&state=${encodeURIComponent(state)}`);
  }

  /** 令牌端点：授权码兑换 access_token(+refresh_token)，或 refresh_token 静默续期。 */
  @Post("oauth/token")
  async token(@Req() req: Request, @Res() res: Response) {
    const { grant_type, code, redirect_uri, code_verifier, refresh_token } = req.body as {
      grant_type?: string;
      code?: string;
      redirect_uri?: string;
      code_verifier?: string;
      refresh_token?: string;
    };
    try {
      if (grant_type === "authorization_code") {
        const { accessToken, refreshToken, expiresIn } = await this.oauth.exchangeCode({
          code: code ?? "",
          redirectUri: redirect_uri ?? "",
          codeVerifier: code_verifier,
        });
        return res.json({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: "Bearer",
          expires_in: expiresIn,
        });
      }
      if (grant_type === "refresh_token") {
        const { accessToken, refreshToken, expiresIn } = await this.oauth.refreshToken(
          refresh_token ?? "",
        );
        return res.json({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: "Bearer",
          expires_in: expiresIn,
        });
      }
      return res.status(400).json({ error: "unsupported_grant_type" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "invalid_grant";
      return res.status(400).json({ error: msg });
    }
  }

  private sendError(res: Response, msg: string) {
    const html = page(
      "授权失败",
      `<h1>授权失败</h1><p class="sub">${msg}</p>`,
    );
    return res.type("html").status(400).send(html);
  }
}
