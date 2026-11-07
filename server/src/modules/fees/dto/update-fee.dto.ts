import { IsNumber, IsOptional, IsString, Min } from "class-validator";

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
}
