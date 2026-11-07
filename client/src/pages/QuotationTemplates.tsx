import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { PageMeta } from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { UniverSheetsHandle } from "@/components/demo/UniverSheetsDemo";
import { expandSnapshot } from "@/lib/univerLoop";
import { sampleTemplateData } from "@/lib/quotationFields";
import { downloadUniverSnapshot } from "@/lib/univerToXlsx";
import {
  listQuotationTemplates,
  createQuotationTemplate,
  updateQuotationTemplate,
  deleteQuotationTemplate,
  type QuotationTemplate,
} from "@/api/quotationTemplates";

// 重型 Univer preset 仅在进入编辑态/预览态时才动态加载，避免拖累模板列表页首屏
const UniverSheetsDemo = lazy(() => import("@/components/demo/UniverSheetsDemo"));

interface EditingState {
  id?: string;
  name: string;
  docType: string;
  snapshot?: unknown;
}

/** 适用单据类型展示名（与后端 TEMPLATE_DOC_TYPES 对应，当前仅报价单） */
const DOC_TYPE_LABELS: Record<string, string> = {
  quotation: "报价单",
};

function formatDate(v: string): string {
  try {
    return new Date(v).toLocaleDateString("zh-CN");
  } catch {
    return "--";
  }
}

/**
 * 单据模板设置：业务单据制作成模板后，可再用模板进行单据的导出。
 * 表格管理（预览 / 编辑 / 导出 / 删除）+ 全屏编辑器（系统字段占位符 + 循环区域）。
 */
export default function QuotationTemplates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [previewing, setPreviewing] = useState<QuotationTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuotationTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<UniverSheetsHandle | null>(null);

  const refresh = async () => {
    try {
      setTemplates(await listQuotationTemplates());
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNew = () =>
    setEditing({ name: t("templates.new"), docType: "quotation", snapshot: undefined });

  const handleEdit = (tpl: QuotationTemplate) =>
    setEditing({ id: tpl.id, name: tpl.name, docType: tpl.docType || "quotation", snapshot: tpl.sheetSnapshot });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const snap = await sheetRef.current?.getSnapshot();
      if (editing.id) {
        await updateQuotationTemplate(editing.id, {
          name: editing.name,
          docType: editing.docType,
          sheetSnapshot: snap,
        });
      } else {
        await createQuotationTemplate(editing.name, snap, editing.docType);
      }
      toast.success(t("quotation.saved"));
      setEditing(null);
      await refresh();
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteQuotationTemplate(pendingDelete.id);
      toast.success(t("quotation.saved"));
      setPendingDelete(null);
      await refresh();
    } catch {
      toast.error(t("quotation.loadFailed"));
    }
  };

  // 表格行「导出」：直接把模板快照转 xlsx 下载（纯函数，无需 Univer 实例）
  const handleExportTemplate = async (tpl: QuotationTemplate) => {
    await downloadUniverSnapshot(tpl.sheetSnapshot, `${tpl.name || "template"}.xlsx`);
    toast.success("已开始下载模板 Excel");
  };

  // 预览：模板快照按样例数据展开成品（系统字段真实值 + 循环区按明细行展开）
  const previewSnapshot = previewing
    ? expandSnapshot(previewing.sheetSnapshot, sampleTemplateData().lines, sampleTemplateData())
    : undefined;

  const filtered =
    docTypeFilter === "all"
      ? templates
      : templates.filter((tpl) => (tpl.docType || "quotation") === docTypeFilter);

  // ---- 编辑态：全屏编辑器（系统字段占位符 + 循环区域 + 下载/保存） ----
  if (editing) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageMeta
          title={t("templates.title")}
          actions={
            <>
              <Button
                variant="outline"
                onClick={async () => {
                  const snap = await sheetRef.current?.getSnapshot();
                  if (snap) await downloadUniverSnapshot(snap, `${editing.name || "template"}.xlsx`);
                }}
                className="gap-1"
              >
                <Download className="size-4" />
                {t("quotation.downloadExcel")}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {t("common.save")}
              </Button>
            </>
          }
        />
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={editing.name}
              onChange={(e) => setEditing((p) => (p ? { ...p, name: e.target.value } : p))}
              placeholder={t("templates.namePlaceholder")}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">适用单据</span>
              <Select
                value={editing.docType}
                onValueChange={(v) => setEditing((p) => (p ? { ...p, docType: v } : p))}
              >
                <SelectTrigger className="h-9 w-36">
                  <SelectValue>
                    {(v: string) => (DOC_TYPE_LABELS[v] ?? v)}
                  </SelectValue>
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
                key={editing.id ?? "new"}
                ref={sheetRef}
                initialSnapshot={editing.snapshot}
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

  // ---- 列表态：单据模板设置表格 ----
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title="单据模板设置"
        description="将您的业务单据制作成模板后，可再用模板进行单据的导出"
        actions={
          <Button onClick={handleNew} disabled={loading}>
            {t("templates.new")}
          </Button>
        }
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">共 {filtered.length} 条数据</span>
        <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue>
              {(v: string) => (v === "all" ? "全部单据类型" : (DOC_TYPE_LABELS[v] ?? v))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部单据类型</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">{t("auth.loading")}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{t("templates.empty")}</Card>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模板名称</TableHead>
                <TableHead>适用单据</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="w-12 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="max-w-72 truncate font-medium">{tpl.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {DOC_TYPE_LABELS[tpl.docType || "quotation"] ?? tpl.docType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(tpl.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(tpl.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            aria-label={`模板 ${tpl.name} 操作`}
                          />
                        }
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewing(tpl)}>
                          <Eye className="size-4" />
                          预览
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(tpl)}>
                          <Pencil className="size-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportTemplate(tpl)}>
                          <Download className="size-4" />
                          导出
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setPendingDelete(tpl)}
                        >
                          <Trash2 className="size-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 预览：模板按样例数据展开成品（只读示意，不落库） */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="flex h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1400px,94vw)]">
          <DialogHeader className="shrink-0 border-b py-4 pr-12 pl-4">
            <DialogTitle>预览模板 - {previewing?.name}</DialogTitle>
            <DialogDescription>
              按样例数据展开的成品效果（系统字段真实值 + 循环区域按明细行展开）
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 overflow-hidden p-4">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
              {previewSnapshot && (
                <UniverSheetsDemo initialSnapshot={previewSnapshot} fill />
              )}
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("templates.confirmDelete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("templates.confirmDeleteDesc")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmDelete}>{t("templates.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
