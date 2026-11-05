import { IsObject, IsString } from "class-validator";

/** 创建报价单版式模板：名称 + TipTap 文档 JSON（含 mergeField 占位符）。 */
export class CreateQuotationTemplateDto {
  @IsString()
  name: string;

  /** TipTap 文档 JSON（含 mergeField 占位符；line.* 表格预览时按明细循环展开）。 */
  @IsObject()
  layout: Record<string, unknown>;
}
