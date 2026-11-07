import { IsIn, IsObject, IsOptional, IsString } from "class-validator";
import { TEMPLATE_DOC_TYPES } from "./create-quotation-template.dto";

/** 更新报价单模板（部分字段）。 */
export class UpdateQuotationTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(TEMPLATE_DOC_TYPES)
  docType?: string;

  @IsOptional()
  @IsObject()
  sheetSnapshot?: Record<string, unknown>;
}
