import { IsArray, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateFeeDto {
  /** 费用类型（如 样品费 / 设计费 / 物流费 / 其他）。 */
  @IsOptional()
  @IsString()
  type?: string;

  /** 金额（元，CNY）。 */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  /** 备注（费用说明 / 凭证号等）。 */
  @IsOptional()
  @IsString()
  note?: string;

  /** 回款凭证附件列表，可选；不传则保留原值。 */
  @IsOptional()
  @IsArray()
  attachments?: { name?: string; url: string }[];

  /** 旧版单图凭证 URL（兼容保留，可选）。 */
  @IsOptional()
  @IsString()
  voucherUrl?: string;

  /** 付款日期（ISO 日期字符串，可选）。 */
  @IsOptional()
  @IsString()
  paidAt?: string;

  /** 资金账户（可选）。 */
  @IsOptional()
  @IsString()
  fundAccount?: string;
}
