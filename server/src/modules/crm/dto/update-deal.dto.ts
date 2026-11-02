import { IsOptional, IsString, IsNumber, IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Priority, ContactType } from "@prisma/client";
import { DealLineDto } from "./deal-line.dto";

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
  customerType?: string; // 客户类型（业务类型，区别于 type 实体类型）

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
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string; // 单位（台 / 个 / 件 …）
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
  source?: string;

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

  /** 订单明细（产品需求）：整张表随商机保存；空 productId 的产品行会在产品库新建。 */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DealLineDto)
  lines?: DealLineDto[];
}
