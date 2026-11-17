import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

/** 批量把阶段任务标记为完成（问题模块尚未搭建，暂只处理任务）。 */
export class BulkCompleteTasksDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
