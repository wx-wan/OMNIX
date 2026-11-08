import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { UniverSheetsHandle } from "@/components/demo/UniverSheetsDemo";
import { downloadUniverSnapshot } from "@/lib/univerToXlsx";
import {
  getQuotationTemplate,
  createQuotationTemplate,
  updateQuotationTemplate,
} from "@/api/quotationTemplates";

// 重型 Univer preset 仅在本页动态加载（新标签页独立 chunk，不拖累主应用首屏）
const UniverSheetsDemo = lazy(() => import("@/components/demo/UniverSheetsDemo"));

/** 适用单据类型展示名（与后端 TEMPLATE_DOC_TYPES 对应，当前仅报价单） */
const DOC_TYPE_LABELS: Record<string, string> = {
  quotation: "报价单",
};

/** 关闭当前标签页；非脚本打开的标签页退化为返回上一页（回到列表） */
function closeSelf() {
  window.close();
  window.history.back();
}

/**
 * 单据模板设计器（独立全屏页，新建 / 编辑共用）：系统字段占位符 + 循环区域 + 下载 / 保存。
 * 路由：/quotation-templates/new（新建）与 /quotation-templates/:id/edit（编辑）。
 * 由模板列表页以「新建标签页」方式打开。
 */
export default function QuotationTemplateEditor() {
  const { id } = useParams();
  const isEdit = !!id;
  const { t } = useTranslation();
  const sheetRef = useRef<UniverSheetsHandle | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [name, setName] = useState(t("templates.new"));
  const [docType, setDocType] = useState("quotation");
  const [initialSnapshot, setInitialSnapshot] = useState<unknown>(undefined);
  const [saving, setSaving] = useState(false);

  // 编辑态：按 id 拉取模板（名称 / 适用单据 / 工作簿快照）
  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      try {
        const tpl = await getQuotationTemplate(id!);
        if (!alive) return;
        setName(tpl.name);
        setDocType(tpl.docType || "quotation");
        setInitialSnapshot(tpl.sheetSnapshot);
      } catch {
        toast.error(t("quotation.loadFailed"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const snap = await sheetRef.current?.getSnapshot();
      if (isEdit) {
        await updateQuotationTemplate(id!, { name, docType, sheetSnapshot: snap });
      } else {
        await createQuotationTemplate(name, snap, docType);
      }
      toast.success(t("quotation.saved"));
      closeSelf();
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  // ---- 加载态（编辑态拉取模板期间） ----
  if (loading) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={closeSelf} title="返回">
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">加载中…</span>
        </header>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // ---- 设计器态 ----
  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <Button variant="ghost" size="icon" className="size-8" onClick={closeSelf} title="返回">
          <ArrowLeft className="size-4" />
        </Button>
        <span className="shrink-0 truncate text-sm font-semibold">
          {isEdit ? `${t("templates.edit")} - ${name}` : t("templates.new")}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-1"
            onClick={async () => {
              const snap = await sheetRef.current?.getSnapshot();
              if (snap) await downloadUniverSnapshot(snap, `${name || "template"}.xlsx`);
            }}
          >
            <Download className="size-4" />
            {t("quotation.downloadExcel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {t("common.save")}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("templates.namePlaceholder")}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">适用单据</span>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue>{(v: string) => (DOC_TYPE_LABELS[v] ?? v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            点选左侧系统字段插入 {"{{占位符}}"}；写有产品字段的行即为明细循环区域，导出时按明细行展开
          </p>
        </div>
        {/* 行级 flex 容器：UniverSheetsDemo 根节点作为子项被纵向拉伸撑满高度 */}
        <div className="flex min-h-0 flex-1 flex-row overflow-hidden rounded-lg border border-border">
          <Suspense
            fallback={
              <div className="flex-1">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            }
          >
            <UniverSheetsDemo
              key={id ?? "new"}
              ref={sheetRef}
              initialSnapshot={initialSnapshot}
              persistLoop
              templateMode
              fill
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
