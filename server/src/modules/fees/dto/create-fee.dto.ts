import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateFeeDto {
  /** 关联商机（费用按商机归集）。 */
  @IsString()
  dealId!: string;

  /** 费用类型（样品费 / 设计费 / 定金30% / 尾款70%）。 */
  @IsString()
  @IsNotEmpty()
  type!: string;

  /** 金额（元，CNY）。 */
  @IsNumber()
  @Min(0)
  amount!: number;

  /** 备注（费用说明 / 凭证号等）。 */
  @IsOptional()
  @IsString()
  note?: string;

  /** 回款凭证附件（图片或 PDF）。添加费用时必传。 */
  @IsArray()
  @ArrayNotEmpty()
  attachments!: { name?: string; url: string }[];

  /** 旧版单图凭证 URL（兼容保留，可选；新流程请传 attachments）。 */
  @IsOptional()
  @IsString()
  voucherUrl?: string;

  /** 付款日期（ISO 日期字符串）。添加费用时必填。 */
  @IsString()
  @IsNotEmpty()
  paidAt!: string;

  /** 资金账户。添加费用时必填。 */
  @IsString()
  @IsNotEmpty()
  fundAccount!: string;
}
