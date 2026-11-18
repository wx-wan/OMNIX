import { IsOptional, IsString } from "class-validator";

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
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
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  /** 创建人可改派：列表里以与经办人一致的下拉编辑。 */
  @IsOptional()
  @IsString()
  reporterId?: string | null;

  @IsOptional()
  @IsString()
  sprintId?: string | null;
}
