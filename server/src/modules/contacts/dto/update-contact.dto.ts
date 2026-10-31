import {
  IsEnum,
  IsEmail,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
} from "class-validator";
import { ContactType } from "@prisma/client";

// 统一往来单位 / 联系人 编辑字段（均可选）
export class UpdateContactDto {
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  company?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  role?: string;
}
