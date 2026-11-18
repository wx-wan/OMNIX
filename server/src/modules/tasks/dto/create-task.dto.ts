import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

// 任务新建字段：projectId 存前端工作区项目 id（工作区项目仍由前端快照承载，仅作字符串关联）
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string; // todo | in_progress | review | done | closed

  @IsOptional()
  @IsString()
  priority?: string; // low | medium | high | urgent

  /** 事项类型：output 输出 | prompt 提示 | input 输入。 */
  @IsOptional()
  @IsString()
  type?: string;

  /** 操作列记录的预设操作 id（仅记录，不执行）。 */
  @IsOptional()
  @IsString()
  action?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  sprintId?: string | null;

  @IsOptional()
  @IsInt()
  estimate?: number | null;

  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;
}
