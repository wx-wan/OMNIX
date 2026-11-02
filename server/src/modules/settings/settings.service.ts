import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { networkInterfaces } from "os";
import { PrismaService } from "../../prisma/prisma.service";

const KEY_ENABLED = "mcp.enabled";
const KEY_TOKEN = "mcp.token";

export interface McpSettings {
  enabled: boolean;
  token: string | null;
  /** 本机局域网 IPv4（如 192.168.1.50）；供「同 WiFi 设备」直连提示。 */
  lanIp: string | null;
}

/** 取第一块非内部 IPv4 网卡地址（en0 / eth0 等真实局域网接口）。 */
function detectLanIp(): string | null {
  const nets = networkInterfaces();
  for (const infos of Object.values(nets)) {
    for (const n of infos ?? []) {
      if (n.family === "IPv4" && !n.internal) return n.address;
    }
  }
  return null;
}

/**
 * 系统设置读写。MCP 相关：
 * - mcp.enabled：是否启用 /mcp 端点（默认 true，保持现有行为不退化）
 * - mcp.token：Bearer 令牌；为空时回退到环境变量 MCP_TOKEN（再为空则开发免鉴权）
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMcpSettings(): Promise<McpSettings> {
    const [enabledRow, tokenRow] = await this.prisma.$transaction([
      this.prisma.setting.findUnique({ where: { key: KEY_ENABLED } }),
      this.prisma.setting.findUnique({ where: { key: KEY_TOKEN } }),
    ]);
    const enabled = enabledRow ? enabledRow.value === "true" : true;
    const token = tokenRow?.value || process.env.MCP_TOKEN || null;
    return { enabled, token, lanIp: detectLanIp() };
  }

  async updateMcpSettings(input: {
    enabled?: boolean;
    token?: string;
  }): Promise<McpSettings> {
    if (input.enabled !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: KEY_ENABLED },
        create: { key: KEY_ENABLED, value: String(input.enabled) },
        update: { value: String(input.enabled) },
      });
    }
    if (input.token !== undefined) {
      await this.prisma.setting.upsert({
        where: { key: KEY_TOKEN },
        create: { key: KEY_TOKEN, value: input.token },
        update: { value: input.token },
      });
    }
    return this.getMcpSettings();
  }

  async regenerateMcpToken(): Promise<{ token: string }> {
    const token = randomBytes(24).toString("hex");
    await this.prisma.setting.upsert({
      where: { key: KEY_TOKEN },
      create: { key: KEY_TOKEN, value: token },
      update: { value: token },
    });
    return { token };
  }
}
