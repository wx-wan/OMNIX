import { IsObject, IsOptional, IsString } from "class-validator";

/** 更新报价单版式模板（部分字段）。 */
export class UpdateQuotationTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;
}
