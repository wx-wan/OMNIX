import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

// 任务更新：全部可选，未传字段保持不变
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

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

  @IsOptional()
  @IsString()
  parentId?: string | null;
}
