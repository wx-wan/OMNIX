import { IsBoolean, IsDateString, IsOptional, IsString, ValidateNested } from "class-validator";
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

  /** 贸易条款（如 EXW / FOB / CIF）。 */
  @IsOptional()
  @IsString()
  tradeTerms?: string;

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

  /** 价格是否含税：true=单价含税（倒算税额），false=单价不含税（税额另计）。 */
  @IsOptional()
  @IsBoolean()
  priceIncludeTax?: boolean;

  /** 订单明细（整表覆盖，结构与商机产品需求一致）。 */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DealLineDto)
  lines?: DealLineDto[];

  /** 选用的版式模板（QuotationTemplate.id）；传 null 表示回退默认模板。 */
  @IsOptional()
  @IsString()
  templateId?: string | null;

  /** 按单编辑后的「冻结副本」（TipTap 文档 JSON 字符串）；传 null 表示清除副本、恢复实时按模板渲染。 */
  @IsOptional()
  @IsString()
  documentJson?: string | null;
}
