import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

/** 联系人页展示元数据（无对应数据库列，存 Setting 键值表 contacts.ui.*）。 */
export class UpdateContactUiMetaDto {
  @IsOptional()
  @IsBoolean()
  starred?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
