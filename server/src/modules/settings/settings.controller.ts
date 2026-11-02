import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { SettingsService } from "./settings.service";

/**
 * 设置 API。受全局 session 守卫保护（需登录）。
 * 路由：GET/PUT /api/settings/mcp，POST /api/settings/mcp/regenerate
 */
@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("mcp")
  getMcp() {
    return this.settings.getMcpSettings();
  }

  @Put("mcp")
  updateMcp(@Body() body: { enabled?: boolean; token?: string }) {
    return this.settings.updateMcpSettings(body);
  }

  @Post("mcp/regenerate")
  regenerate() {
    return this.settings.regenerateMcpToken();
  }
}
