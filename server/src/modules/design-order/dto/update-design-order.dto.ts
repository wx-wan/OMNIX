import { IsIn, IsOptional, IsString, IsNumber } from "class-validator";
import { DESIGN_PRODUCT_TYPES, DESIGN_STATUSES } from "./create-design-order.dto";

export class UpdateDesignOrderDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  @IsIn(DESIGN_PRODUCT_TYPES)
  productType?: string;

  @IsOptional()
  @IsString()
  assistantId?: string;

  @IsOptional()
  @IsIn(DESIGN_STATUSES)
  status?: string;

  @IsOptional()
  mainImage?: unknown;

  @IsOptional()
  threeViews?: unknown;

  @IsOptional()
  @IsNumber()
  designFeeAmount?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
