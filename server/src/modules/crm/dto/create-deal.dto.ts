import { IsOptional, IsString, IsNumber, IsEnum, IsNotEmpty } from "class-validator";
import { Priority } from "@prisma/client";

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  meta?: string;

  /** 不传则默认落入第一个阶段（线索到达）。 */
  @IsOptional()
  @IsString()
  stageId?: string;
}
