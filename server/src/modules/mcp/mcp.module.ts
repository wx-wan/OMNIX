import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { CrmModule } from "../crm/crm.module";
import { OauthModule } from "../oauth/oauth.module";
import { McpService } from "./mcp.service";

/**
 * MCP 模块：通过中间件把 /mcp 挂到 Express，在全局 session 守卫之前短路处理。
 * 因此 Accio Work 用 Bearer Token 调 /mcp 不会被 cookie 会话守卫拦截。
 */
@Module({
  imports: [CrmModule, OauthModule],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule implements NestModule {
  constructor(private readonly mcp: McpService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res) => {
        // 仅拦截 /mcp；其余请求放行给 Nest 正常路由/守卫
        void this.mcp.handle(req, res);
      })
      .forRoutes({ path: "mcp", method: RequestMethod.ALL });
  }
}
