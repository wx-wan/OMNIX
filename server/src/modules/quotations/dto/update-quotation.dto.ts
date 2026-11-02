import { IsDateString, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { DealLineDto } from "../../crm/dto/deal-line.dto";

export class UpdateQuotationDto {
  /** 有效期至（ISO 日期串）。 */
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  /** 付款条款（如：立即 / 预付 30%）。 */
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  /** 交付日期（ISO 日期串）。 */
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  /** 收货地址（多行文本）。 */
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  /** 备注。 */
  @IsOptional()
  @IsString()
  notes?: string;

  /** 订单明细（整表覆盖，结构与商机产品需求一致）。 */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DealLineDto)
  lines?: DealLineDto[];
}
