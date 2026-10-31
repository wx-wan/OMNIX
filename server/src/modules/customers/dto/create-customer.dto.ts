import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

// 公司（客户）新建/编辑字段
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string; // 公司名称 *

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string; // 国家地区

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string; // 官网

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerType?: string; // 客户类型
}
