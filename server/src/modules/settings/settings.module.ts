import { Module } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";

/**
 * 系统设置模块：以键值表（Setting）持久化可在设置页管理的配置。
 * 首期承载 MCP Server 的启用开关与访问令牌。
 */
@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
