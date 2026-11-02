import { IsOptional, IsString, IsNumber, IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Priority } from "@prisma/client";
import { CreateContactDto } from "../../contacts/dto/create-contact.dto";
import { CreateProductDto } from "../../products/dto/create-product.dto";
import { DealLineDto } from "./deal-line.dto";

export class CreateDealDto {
  /** 可不传：默认由 往来单位名 · 产品名 派生。 */
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

  /** 不传则默认落入第一个阶段（线索到达）。 */
  @IsOptional()
  @IsString()
  stageId?: string;

  /** 直接关联已有往来单位 / 联系人（与下方内联新建二选一）。 */
  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  /** 内联新建往来单位 / 联系人并关联（默认 type=customer，落库 contacts 表）。 */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateContactDto)
  contact?: CreateContactDto;

  /** 内联新建产品并关联（落库 products 表）。 */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductDto)
  product?: CreateProductDto;

  /** 订单明细（产品需求）：整张表随商机保存；空 productId 的产品行会在产品库新建。 */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DealLineDto)
  lines?: DealLineDto[];
}
