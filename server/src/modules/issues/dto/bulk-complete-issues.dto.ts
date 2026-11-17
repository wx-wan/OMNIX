import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class BulkCompleteIssuesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
