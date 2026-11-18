import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateIssueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  /** 事项类型：output 输出 | prompt 提示 | input 输入。 */
  @IsOptional()
  @IsString()
  type?: string;

  /** 操作列记录的预设操作 id（仅记录，不执行）。 */
  @IsOptional()
  @IsString()
  action?: string | null;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  sprintId?: string | null;

  @IsInt()
  number!: number;

  @IsString()
  projectId!: string;
}
