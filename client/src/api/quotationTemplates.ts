import { api } from "@/lib/api";

/** 报价单模板（与后端 quotation_templates 表对应；sheetSnapshot 为 Univer 工作簿快照）。 */
export interface QuotationTemplate {
  id: string;
  name: string;
  /** 适用单据类型：quotation=报价单（预留扩展）。 */
  docType: string;
  sheetSnapshot: unknown;
  createdAt: string;
  updatedAt: string;
}

/** 模板列表（可按适用单据类型过滤）。 */
export async function listQuotationTemplates(docType?: string): Promise<QuotationTemplate[]> {
  const r = await api.get<QuotationTemplate[]>("/quotation-templates", {
    params: docType ? { docType } : undefined,
  });
  return r.data;
}

/** 模板详情。 */
export async function getQuotationTemplate(id: string): Promise<QuotationTemplate> {
  const r = await api.get<QuotationTemplate>(`/quotation-templates/${id}`);
  return r.data;
}

/** 创建模板（名称 + 适用单据 + Univer 工作簿快照）。 */
export async function createQuotationTemplate(
  name: string,
  sheetSnapshot: unknown,
  docType?: string,
): Promise<QuotationTemplate> {
  const r = await api.post<QuotationTemplate>("/quotation-templates", {
    name,
    sheetSnapshot,
    ...(docType ? { docType } : {}),
  });
  return r.data;
}

/** 更新模板（名称 / 适用单据 / 工作簿快照）。 */
export async function updateQuotationTemplate(
  id: string,
  patch: { name?: string; sheetSnapshot?: unknown; docType?: string },
): Promise<QuotationTemplate> {
  const r = await api.patch<QuotationTemplate>(`/quotation-templates/${id}`, patch);
  return r.data;
}

/** 删除模板。 */
export async function deleteQuotationTemplate(id: string): Promise<void> {
  await api.delete(`/quotation-templates/${id}`);
}

/** 发送报价单邮件（可附 Excel 附件，附件由前端生成 base64 传上）。 */
export async function sendQuotationEmail(
  id: string,
  payload: {
    to: string;
    subject: string;
    body: string;
    attachmentBase64?: string;
    attachmentName?: string;
  },
): Promise<{ messageId: string }> {
  const r = await api.post<{ messageId: string }>(`/quotations/${id}/send`, payload);
  return r.data;
}
