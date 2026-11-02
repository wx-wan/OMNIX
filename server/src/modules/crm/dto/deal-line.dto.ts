import { IsOptional, IsString, IsNumber } from "class-validator";

/**
 * 订单明细行：与前端 OrderLine 对齐（全字段可选，保证明细 JSON 完整往返）。
 * - 行级字段（数量/折扣）随行存于商机明细，不进产品表。
 * - productId 为空且 type=product 时，保存时会在产品库新建一条（图片/描述/单位/单价/税项落产品库）。
 */
export class DealLineDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  type?: string; // product | combo | note

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  productId?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsString()
  taxId?: string | null;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  image?: string;
}
