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

  // —— PLM 扩展 ——
  @IsOptional()
  @IsString()
  status?: string; // requirement|designing|reviewing|released|obsolete

  @IsOptional()
  @IsString()
  partNo?: string; // 产品编号 / 物料号（多版本共享）

  @IsOptional()
  @IsString()
  revision?: string; // 版本号，默认 A

  @IsOptional()
  @IsString()
  revisionParentId?: string; // 上一版本 id

  @IsOptional()
  drawings?: { name: string; url: string }[]; // 该版本图纸 / 3D / 规格 PDF
}
