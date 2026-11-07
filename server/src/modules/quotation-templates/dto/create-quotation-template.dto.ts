import { IsIn, IsObject, IsOptional, IsString } from "class-validator";

/** 适用单据类型（当前仅报价单，预留扩展）。 */
export const TEMPLATE_DOC_TYPES = ["quotation"] as const;

/** 创建报价单模板：名称 + 适用单据 + Univer 工作簿快照。 */
export class CreateQuotationTemplateDto {
  @IsString()
  name: string;

  /** 适用单据类型；缺省=报价单。 */
  @IsOptional()
  @IsIn(TEMPLATE_DOC_TYPES)
  docType?: string;

  /** Univer 工作簿快照（前端 UniverSheetsDemo 的 getSnapshot 产物）。 */
  @IsObject()
  sheetSnapshot: Record<string, unknown>;
}
