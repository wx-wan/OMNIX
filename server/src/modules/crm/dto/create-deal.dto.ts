import { IsOptional, IsString, IsNumber, IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Priority } from "@prisma/client";
import { CreateCustomerDto } from "../../customers/dto/create-customer.dto";
import { CreateProductDto } from "../../products/dto/create-product.dto";

export class CreateDealDto {
  /** 可不传：默认由 客户名 · 产品名 派生。 */
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

  /** 不传则默认落入第一个阶段（线索到达）。 */
  @IsOptional()
  @IsString()
  stageId?: string;

  /** 直接关联已有客户 / 产品（与下方内联新建二选一）。 */
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  /** 内联新建客户并关联（落库 customers 表）。 */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;

  /** 内联新建产品并关联（落库 products 表）。 */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductDto)
  product?: CreateProductDto;
}
