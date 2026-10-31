import {
  IsEnum,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ContactType } from "@prisma/client";

// 统一往来单位 / 联系人 新建字段
export class CreateContactDto {
  /** 类型：客户 / 供应商 / 用户（默认 customer）。 */
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string; // 组织名称 或 个人姓名 *

  @IsOptional()
  @IsString()
  @MaxLength(80)
  company?: string; // 个人所属公司

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string; // 电子邮箱（唯一）

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string; // 电话号码

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string; // 国家地区

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string; // 官网

  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string; // 仅 type=user 用于登录

  @IsOptional()
  @IsString()
  @MaxLength(20)
  role?: string; // 仅 type=user：admin | user
}
