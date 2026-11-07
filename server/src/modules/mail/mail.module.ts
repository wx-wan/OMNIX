import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";

/** 全局邮件模块：供报价单发送等业务复用。 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
