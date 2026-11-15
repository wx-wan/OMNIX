import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

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
}
