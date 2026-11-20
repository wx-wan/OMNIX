import { Type } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { BusinessCardFileDto } from "./business-card.dto";

// 统一往来单位 / 联系人 编辑字段（均可选）
// type / password / role 不在其中：账号管理走 /api/auth/users，避免联系人接口提权。
export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  customerType?: string; // 客户类型（业务类型，区别于 type 实体类型）

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
  @IsString()
  parentId?: string; // 所属公司 id（个人指向公司，自关联）

  @IsOptional()
  isCompany?: boolean; // 是否为公司

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
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  archived?: boolean; // 归档 / 取消归档（关联了商机的往来单位不允许删除，用归档隐藏代替）

  @IsOptional()
  @IsString()
  @MaxLength(40)
  botCharacter?: string; // 系统机器人的 3D 形象（wobnimo 角色 id）

  // —— 联系人表单字段 ——
  @IsOptional() @IsString() @MaxLength(60) source?: string;
  @IsOptional() @IsString() @MaxLength(40) landline?: string;
  @IsOptional() @IsString() @MaxLength(60) nickname?: string;
  @IsOptional() @IsString() @MaxLength(60) socialPlatform?: string;
  @IsOptional() @IsString() @MaxLength(120) socialAccount?: string;
  @IsOptional() @IsString() @MaxLength(40) mobile?: string;
  @IsOptional() @IsString() @MaxLength(60) jobRank?: string;
  @IsOptional() @IsString() birthday?: string; // YYYY-MM-DD
  @IsOptional() @IsString() @MaxLength(20) gender?: string;
  @IsOptional() @IsString() @MaxLength(1000) contactNotes?: string;

  @IsOptional() @ValidateNested() @Type(() => BusinessCardFileDto)
  businessCardFront?: BusinessCardFileDto | null;

  @IsOptional() @ValidateNested() @Type(() => BusinessCardFileDto)
  businessCardBack?: BusinessCardFileDto | null;
}
