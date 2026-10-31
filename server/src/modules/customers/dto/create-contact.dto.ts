import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

// 联系人新建字段（归属某家公司）
export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string; // 联系人姓名 *

  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string; // 电子邮箱

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string; // 电话号码
}
