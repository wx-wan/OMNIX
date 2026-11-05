import { useMemo } from "react";
import { sampleTemplateData } from "@/lib/quotationFields";
import QuotationTemplateEditor, {
  DEFAULT_QUOTATION_TEMPLATE,
} from "@/components/crm/QuotationTemplateEditor";

/** Showcase 演示：共享的报价单模板编辑器 + 样例数据。 */
export default function QuotationTemplateDemo() {
  const sample = useMemo(() => sampleTemplateData(), []);
  return <QuotationTemplateEditor data={sample} initialDoc={DEFAULT_QUOTATION_TEMPLATE} />;
}
