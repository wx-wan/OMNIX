import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateEcoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsArray()
  productIds?: string[];
}
