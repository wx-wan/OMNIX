import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PillToggle } from "@/components/common/PillToggle";
import TemplateEditorCore, { type TemplateMode } from "./TemplateEditorCore";
import { DEFAULT_QUOTATION_TEMPLATE } from "./QuotationTemplateEditor";
import type { TemplateData } from "@/lib/quotationFields";
import type { QuotationTemplate } from "@/api/quotationTemplates";

function safeParse(json: string | null): JSONContent | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? (v as JSONContent) : null;
  } catch {
    return null;
  }
}

interface QuotationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 报价单实时渲染数据（客户/单号/明细等） */
  data: TemplateData;
  /** 可选模板列表 */
  templates: QuotationTemplate[];
  /** 当前选用的模板 id（报价单 templateId） */
  templateId: string | null;
  /** 已冻结的按单副本（quotation.documentJson）；为空=实时按模板渲染 */
  documentJson: string | null;
  /** 保存：写入报价单的 templateId 与 documentJson（null = 清除副本、恢复实时渲染） */
  onSave: (templateId: string | null, documentJson: string | null) => Promise<void>;
  /** 另存为：把当前编辑器版式存为一个新模板，返回创建结果。提供后底部才显示「另存为」。 */
  onCreateTemplate?: (name: string, layout: JSONContent) => Promise<QuotationTemplate>;
}

/**
 * 报价单预览弹窗：左=编辑/预览（可手改），右=模板选择。
 * 关键约束：在弹窗内手改只写报价单的 documentJson（冻结副本），绝不会回写 QuotationTemplate.layout。
 */
export default function QuotationPreviewModal({
  open,
  onOpenChange,
  data,
  templates,
  templateId,
  documentJson,
  onSave,
  onCreateTemplate,
}: QuotationPreviewModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [frozenDoc, setFrozenDoc] = useState<JSONContent | null>(null);
  const [docVersion, setDocVersion] = useState(0);
  const [mode, setMode] = useState<TemplateMode>("preview");
  const [latestDoc, setLatestDoc] = useState<JSONContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // 左侧「选择模板」栏折叠状态（折叠后留竖条可展开）
  const [tplOpen, setTplOpen] = useState(true);

  // 每次打开：以当前报价单的 templateId / documentJson 初始化（冻结副本优先）
  useEffect(() => {
    if (!open) return;
    const tid = templateId ?? templates[0]?.id ?? null;
    setSelectedTemplateId(tid);
    setFrozenDoc(safeParse(documentJson));
    setDocVersion((v) => v + 1);
    setMode("preview");
    setLatestDoc(null);
    setDirty(false);
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedTpl = templates.find((t) => t.id === selectedTemplateId) ?? null;
  // 冻结副本 > 所选模板版式 > 默认模板（保证编辑器始终有内容可编辑）
  const baseDoc = frozenDoc ?? selectedTpl?.layout ?? DEFAULT_QUOTATION_TEMPLATE;

  const handleSelectTemplate = (id: string) => {
    if (id === selectedTemplateId) return;
    if (dirty) {
      toast.warning(t("quotation.previewDiscardWarn"));
      return;
    }
    setSelectedTemplateId(id);
    if (!frozenDoc) setDocVersion((v) => v + 1); // 实时态：重载版式；冻结态：仅改保存目标
  };

  const handleDocChange = (doc: JSONContent) => {
    setLatestDoc(doc);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedTemplateId, JSON.stringify(latestDoc ?? baseDoc));
      toast.success(t("quotation.saved"));
      onOpenChange(false);
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAs = async () => {
    if (!onCreateTemplate) return;
    const layout = latestDoc ?? baseDoc;
    const suggested = selectedTpl ? `${selectedTpl.name} 副本` : t("quotation.templateNewName");
    const name = window.prompt(t("quotation.saveAsPrompt"), suggested);
    if (!name || !name.trim()) return;
    setSaving(true);
    try {
      const created = await onCreateTemplate(name.trim(), layout);
      setSelectedTemplateId(created.id);
      setFrozenDoc(null); // 改为引用新模板（实时），避免仍带旧副本
      setDirty(false);
      toast.success(t("quotation.saved"));
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleClearFreeze = async () => {
    setSaving(true);
    try {
      await onSave(selectedTemplateId, null); // 清除副本，恢复实时按模板渲染
      toast.success(t("quotation.saved"));
      onOpenChange(false);
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[1800px] max-w-[96vw] sm:max-w-[1800px] flex-col gap-0 p-0">
        {/* 头：标题 + 编辑/预览切换（pr-12 给右上角关闭按钮留位，避免重叠） */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b py-4 pr-12 pl-4">
          <DialogTitle>{t("quotation.previewTitle")}</DialogTitle>
          <PillToggle
            options={[
              { value: "edit", label: t("quotation.templateEdit") },
              { value: "preview", label: t("quotation.templatePreview") },
            ]}
            value={mode}
            onChange={(v) => setMode(v === "preview" ? "preview" : "edit")}
          />
        </div>

        {/* 主体：左 选择模板(可折叠) ｜ 中 系统字段 ｜ 右 在线编辑器 */}
        <div className="flex min-h-0 flex-1">
          {tplOpen ? (
            <div className="flex w-52 shrink-0 flex-col gap-2 overflow-y-auto border-r border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t("quotation.chooseTemplate")}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setTplOpen(false)}
                  title={t("quotation.chooseTemplate")}
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("quotation.noTemplate")}</p>
              )}
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={
                    "rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                    (tpl.id === selectedTemplateId
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent")
                  }
                >
                  {tpl.name}
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/quotation-templates");
                }}
              >
                {t("quotation.manageTemplates")}
              </Button>
            </div>
          ) : (
            <div className="flex w-9 shrink-0 flex-col items-center gap-2 border-r border-border py-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setTplOpen(true)}
                title={t("quotation.chooseTemplate")}
              >
                <ChevronRight className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground [writing-mode:vertical-rl]">
                {t("quotation.chooseTemplate")}
              </span>
            </div>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <TemplateEditorCore
              key={docVersion}
              data={data}
              initialDoc={baseDoc}
              mode={mode}
              onDocChange={handleDocChange}
              palette
              className="flex min-h-0 flex-1 flex-row gap-3 p-4"
            />
          </div>
        </div>

        {/* 底：清除副本 / 保存 */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t p-4">
          <span className="text-xs text-muted-foreground">
            {dirty ? t("quotation.previewDirty") : t("quotation.previewClean")}
          </span>
          <div className="flex gap-2">
            {mode === "edit" && (
              <Button variant="outline" onClick={handleSaveAs} disabled={saving || !onCreateTemplate}>
                {t("quotation.saveAs")}
              </Button>
            )}
            {mode === "edit" && (
              <Button variant="outline" onClick={handleClearFreeze} disabled={saving}>
                {t("quotation.clearFreeze")}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
