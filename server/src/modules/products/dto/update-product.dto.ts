import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
} from "class-validator";

// 产品更新：所有字段可选（创建用 CreateProductDto 要求 description 必填，更新不需要）。
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsString()
  process?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  partNo?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  specs?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isRequirement?: boolean;

  @IsOptional()
  drawings?: { name: string; url: string }[];
}
