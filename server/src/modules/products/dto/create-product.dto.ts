import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
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
  @IsInt()
  quantity?: number;
}
