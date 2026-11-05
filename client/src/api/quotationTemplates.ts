import type { JSONContent } from "@tiptap/core";
import { api } from "@/lib/api";

/** 报价单版式模板（与后端 quotation_templates 表对应）。 */
export interface QuotationTemplate {
  id: string;
  name: string;
  layout: JSONContent;
  createdAt: string;
  updatedAt: string;
}

/** 模板列表。 */
export async function listQuotationTemplates(): Promise<QuotationTemplate[]> {
  const r = await api.get<QuotationTemplate[]>("/quotation-templates");
  return r.data;
}

/** 模板详情。 */
export async function getQuotationTemplate(id: string): Promise<QuotationTemplate> {
  const r = await api.get<QuotationTemplate>(`/quotation-templates/${id}`);
  return r.data;
}

/** 创建模板。 */
export async function createQuotationTemplate(
  name: string,
  layout: JSONContent,
): Promise<QuotationTemplate> {
  const r = await api.post<QuotationTemplate>("/quotation-templates", { name, layout });
  return r.data;
}

/** 更新模板（名称 / 版式）。 */
export async function updateQuotationTemplate(
  id: string,
  patch: { name?: string; layout?: JSONContent },
): Promise<QuotationTemplate> {
  const r = await api.patch<QuotationTemplate>(`/quotation-templates/${id}`, patch);
  return r.data;
}

/** 删除模板。 */
export async function deleteQuotationTemplate(id: string): Promise<void> {
  await api.delete(`/quotation-templates/${id}`);
}
