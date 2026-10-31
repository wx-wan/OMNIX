import { IsOptional, IsString, IsNumber, IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Priority, ContactType } from "@prisma/client";

/** 商机关联的往来单位（联系人）可编辑字段（部分更新）。 */
export class UpdateDealContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;
}

/** 商机关联的产品可编辑字段（部分更新）。 */
export class UpdateDealProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  spec?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  meta?: string;

  @IsOptional()
  @IsString()
  stageId?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDealContactDto)
  contact?: UpdateDealContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDealProductDto)
  product?: UpdateDealProductDto;
}
