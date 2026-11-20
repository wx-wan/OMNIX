import { Type } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { BusinessCardFileDto } from "./business-card.dto";

// 统一往来单位 / 联系人 新建字段
// 注意：type / password / role 不在这里开放，防止联系人接口被用于提权创建管理员。
export class CreateContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  customerType?: string; // 客户类型（业务类型，区别于 type 实体类型）

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string; // 组织名称 或 个人姓名 *

  @IsOptional()
  @IsString()
  @MaxLength(80)
  company?: string; // 个人所属公司（旧版文本，迁移后由 parentId 取代）

  @IsOptional()
  @IsString()
  parentId?: string; // 所属公司 id（个人指向公司，自关联；新建公司时为空）

  @IsOptional()
  isCompany?: boolean; // 是否为公司（区别于个人联系人）

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
  avatarUrl?: string; // 头像地址（联系人页用本地 /images/profile/user-N.png）

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string; // 官网

  // —— 联系人表单：公司常用信息 + 联系人信息 ——
  @IsOptional() @IsString() @MaxLength(60) source?: string; // 客户来源
  @IsOptional() @IsString() @MaxLength(40) landline?: string; // 座机
  @IsOptional() @IsString() @MaxLength(60) nickname?: string; // 昵称
  @IsOptional() @IsString() @MaxLength(60) socialPlatform?: string; // 社交平台
  @IsOptional() @IsString() @MaxLength(120) socialAccount?: string; // 社交账号
  @IsOptional() @IsString() @MaxLength(40) mobile?: string; // 联系电话
  @IsOptional() @IsString() @MaxLength(60) jobRank?: string; // 职级
  @IsOptional() @IsString() birthday?: string; // 生日 YYYY-MM-DD
  @IsOptional() @IsString() @MaxLength(20) gender?: string; // 性别
  @IsOptional() @IsString() @MaxLength(1000) contactNotes?: string; // 联系人备注

  @IsOptional() @ValidateNested() @Type(() => BusinessCardFileDto)
  businessCardFront?: BusinessCardFileDto;

  @IsOptional() @ValidateNested() @Type(() => BusinessCardFileDto)
  businessCardBack?: BusinessCardFileDto;
}
