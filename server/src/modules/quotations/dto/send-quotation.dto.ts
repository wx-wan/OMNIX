import {
  IsBase64,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/** 发送报价单邮件：收件人 + 主题 + 正文（可附 Excel 附件，前端生成 base64 传上）。 */
export class SendQuotationDto {
  @IsEmail()
  to: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @IsString()
  @MaxLength(20000)
  body: string;

  /** xlsx 附件内容（base64，不含 data: 前缀）。 */
  @IsOptional()
  @IsBase64()
  attachmentBase64?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  attachmentName?: string;
}
