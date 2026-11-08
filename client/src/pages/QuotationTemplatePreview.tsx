import { Suspense, lazy, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { expandSnapshot } from "@/lib/univerLoop";
import { sampleTemplateData } from "@/lib/quotationFields";
import { getQuotationTemplate } from "@/api/quotationTemplates";

// 重型 Univer preset 仅在本页动态加载（新标签页独立 chunk，不拖累主应用首屏）
const UniverSheetsDemo = lazy(() => import("@/components/demo/UniverSheetsDemo"));

/** 关闭当前标签页；非脚本打开的标签页退化为返回上一页（回到列表） */
function closeSelf() {
  window.close();
  window.history.back();
}

/**
 * 单据模板预览（独立全屏页，只读）：模板快照按样例数据展开成品。
 * 路由：/quotation-templates/:id/preview。由模板列表页以「新建标签页」方式打开。
 */
export default function QuotationTemplatePreview() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [previewSnapshot, setPreviewSnapshot] = useState<unknown>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tpl = await getQuotationTemplate(id!);
        if (!alive) return;
        setName(tpl.name);
        // 按样例数据展开成品（系统字段真实值 + 循环区域按明细行展开）
        setPreviewSnapshot(
          expandSnapshot(tpl.sheetSnapshot, sampleTemplateData().lines, sampleTemplateData()),
        );
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

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <Button variant="ghost" size="icon" className="size-8" onClick={closeSelf} title="返回">
          <ArrowLeft className="size-4" />
        </Button>
        <span className="shrink-0 truncate text-sm font-semibold">
          {t("templates.title")} · 预览 - {name}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        {loading || !previewSnapshot ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
            <UniverSheetsDemo initialSnapshot={previewSnapshot} fill hidePanel />
          </Suspense>
        )}
      </div>
    </div>
  );
}
