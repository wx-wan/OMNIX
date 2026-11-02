import { IsString } from "class-validator";

export class CreateQuotationDto {
  /** 从哪个商机生成报价单（复制产品需求明细、关联商机客户）。 */
  @IsString()
  dealId!: string;
}
