import { IsIn, IsOptional, IsString, IsNumber, IsInt, Min } from "class-validator";
import { SAMPLE_TYPES, SAMPLE_STATUSES } from "./create-sample-order.dto";

export class UpdateSampleOrderDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  @IsIn(SAMPLE_TYPES)
  sampleType?: string;

  @IsOptional()
  @IsString()
  assistantId?: string;

  @IsOptional()
  @IsIn(SAMPLE_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  colorCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  craft?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  hardness?: string;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  requiredCompletion?: string;

  @IsOptional()
  @IsString()
  orderDate?: string;

  @IsOptional()
  @IsString()
  functionalReq?: string;

  @IsOptional()
  packagingImage?: unknown;

  @IsOptional()
  engravingImage?: unknown;

  @IsOptional()
  otherAttachments?: unknown;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @IsOptional()
  @IsNumber()
  packagingLength?: number;

  @IsOptional()
  @IsNumber()
  packagingWidth?: number;

  @IsOptional()
  @IsNumber()
  packagingHeight?: number;

  @IsOptional()
  sampleFiles?: unknown;

  @IsOptional()
  @IsString()
  trackingNo?: string;

  @IsOptional()
  @IsString()
  recipient?: string;
}
