import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateFeeDto {
  /** 关联商机（费用按商机归集）。 */
  @IsString()
  dealId!: string;

  /** 费用类型（如 样品费 / 设计费 / 物流费 / 其他）。 */
  @IsString()
  type!: string;

  /** 金额（元，CNY）。 */
  @IsNumber()
  @Min(0)
  amount!: number;

  /** 备注（费用说明 / 凭证号等）。 */
  @IsOptional()
  @IsString()
  note?: string;
}
