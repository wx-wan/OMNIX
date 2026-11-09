import { IsOptional, IsString, IsInt } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  // 参数化规格模板：[{ key, label, type, unit?, options?, required? }]
  specTemplate?: unknown;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  specTemplate?: unknown;
}
