import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { JSONContent } from "@tiptap/core";
import { Card } from "@/components/ui/card";
import { PillToggle } from "@/components/common/PillToggle";
import TemplateEditorCore, { type TemplateMode } from "./TemplateEditorCore";
import type { TemplateData } from "@/lib/quotationFields";

/** 默认报价单模板（TipTap JSON），可在编辑器里自由修改。 */
export const DEFAULT_QUOTATION_TEMPLATE: JSONContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "报 价 单" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "致：" },
        { type: "mergeField", attrs: { key: "customer.name", label: "客户名称" } },
        { type: "text", text: "（" },
        { type: "mergeField", attrs: { key: "customer.country", label: "客户国家/地区" } },
        { type: "text", text: "）" },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "报价单号 " },
        { type: "mergeField", attrs: { key: "quotation.number", label: "报价单号" } },
        { type: "text", text: "　报价日期 " },
        { type: "mergeField", attrs: { key: "quotation.date", label: "报价日期" } },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "点工具条「表格」插入表格，再把左侧「明细行」字段拖入单元格，预览即按明细行循环输出。",
        },
      ],
    },
  ],
};

interface QuotationTemplateEditorProps {
  /** 渲染数据（真实报价单或样例数据） */
  data: TemplateData;
  /** 初始模板内容；缺省用 DEFAULT_QUOTATION_TEMPLATE */
  initialDoc?: JSONContent;
  /** 文档内容变化回调（模板管理页据此保存版式） */
  onDocChange?: (doc: JSONContent) => void;
  className?: string;
}

/**
 * 报价单模板设计器（模板管理页 / Showcase 演示共用）：
 * 卡片头含「编辑/预览」切换，主体为系统字段调色板 + 富文本编辑 + 按数据渲染预览。
 */
export default function QuotationTemplateEditor({
  data,
  initialDoc,
  onDocChange,
  className,
}: QuotationTemplateEditorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TemplateMode>("edit");

  return (
    <Card className={className}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="font-heading text-base font-semibold text-foreground">
            {t("quotation.template")}
          </div>
          <p className="truncate text-xs text-muted-foreground">{t("quotation.templateHint")}</p>
        </div>
        <PillToggle
          options={[
            { value: "edit", label: t("quotation.templateEdit") },
            { value: "preview", label: t("quotation.templatePreview") },
          ]}
          value={mode}
          onChange={(v) => setMode(v === "preview" ? "preview" : "edit")}
        />
      </div>

      <TemplateEditorCore
        data={data}
        initialDoc={initialDoc ?? DEFAULT_QUOTATION_TEMPLATE}
        mode={mode}
        onDocChange={onDocChange}
        className="flex min-h-0 flex-1 flex-row gap-3 p-4"
      />
    </Card>
  );
}
