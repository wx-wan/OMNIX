import { IsOptional, IsString, MaxLength } from "class-validator";

/** 名片一侧的文件引用；只存 URL 与元信息，不落 Base64。 */
export class BusinessCardFileDto {
  // 让 DTO 可直接作为 Prisma Json 字段输入（InputJsonObject 要求字符串索引签名）。
  [key: string]: string | undefined;

  @IsString()
  @MaxLength(120)
  id!: string;

  @IsString()
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  filename?: string;
}
