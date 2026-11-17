import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

// 项目新建：id 沿用前端工作区项目 id（p1 / p-new-*），便于 Task.projectId 等字符串关联直接对接。
// dueDate 保留前端相对占位符（RELATIVE_DAYS_PLUS30）或 ISO 字符串。
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  status?: string; // active | on_hold | completed

  @IsOptional()
  @IsString()
  priority?: string; // low | medium | high | urgent

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @IsOptional()
  @IsString()
  leadId?: string | null;

  @IsOptional()
  @IsInt()
  progress?: number;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsString()
  teamId?: string | null;

  @IsOptional()
  @IsString()
  stage?: string; // requirement | quotation | sample | order | expense | purchase | production | logistics | after_sales

  @IsOptional()
  @IsString()
  no?: string; // 项目编号，如 #2611002
}
