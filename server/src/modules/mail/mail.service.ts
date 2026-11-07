import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

/**
 * SMTP 邮件发送服务。
 * 配置全部来自环境变量（.env）：
 *  - SMTP_HOST / SMTP_PORT / SMTP_SECURE（可选，465 端口默认 true）
 *  - SMTP_USER / SMTP_PASS
 *  - SMTP_FROM（可选，缺省用 SMTP_USER）
 * 未配置 SMTP_HOST 时接口返回 400 并给出明确提示，前端据此引导用户配置。
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async send(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    attachment?: { filename: string; base64: string } | null;
  }): Promise<{ messageId: string }> {
    const host = process.env.SMTP_HOST;
    if (!host) {
      throw new BadRequestException(
        "邮件服务未配置：请在 server/.env 中设置 SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM",
      );
    }
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "";
    try {
      const info = await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        attachments: params.attachment
          ? [
              {
                filename: params.attachment.filename,
                content: Buffer.from(params.attachment.base64, "base64"),
                contentType:
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              },
            ]
          : undefined,
      });
      this.logger.log(`邮件已发送 to=${params.to} messageId=${info.messageId}`);
      return { messageId: info.messageId };
    } catch (err) {
      this.logger.error(`邮件发送失败 to=${params.to}: ${String(err)}`);
      throw new BadRequestException(
        `邮件发送失败，请检查 SMTP 配置与凭据：${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
