import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
} from "class-validator";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  description: string; // 描述 *

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
  unit?: string; // 单位（台 / 个 / 件 …）

  @IsOptional()
  @IsString()
  parentId?: string; // 变体来源产品 id（为空=标准产品）

  @IsOptional()
  @IsBoolean()
  isRequirement?: boolean; // 是否为需求阶段新建的产品（需求产品）
}
