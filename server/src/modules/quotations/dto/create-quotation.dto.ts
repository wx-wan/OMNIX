import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateQuotationDto {
  /** 从哪个商机生成报价单（复制产品需求明细、关联商机客户）。 */
  @IsString()
  dealId!: string;

  /** 价格是否含税（可选）：前端从商机当前状态带入；缺省时由后端读取商机自身状态继承。 */
  @IsOptional()
  @IsBoolean()
  priceIncludeTax?: boolean;
}
