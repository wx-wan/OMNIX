import { useEffect, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadUniverSnapshot } from "@/lib/univerToXlsx";
import {
  listQuotationTemplates,
  deleteQuotationTemplate,
  type QuotationTemplate,
} from "@/api/quotationTemplates";

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
 * 表格管理（预览 / 编辑 / 导出 / 删除）。新建 / 编辑 / 预览均在「新建标签页」打开独立全屏页。
 */
export default function QuotationTemplates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [pendingDelete, setPendingDelete] = useState<QuotationTemplate | null>(null);

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

  // 从模板设计器/预览标签页返回列表时（标签页重新可见 / 窗口聚焦）自动刷新，保证新建/编辑结果可见
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 新建 / 编辑 / 预览：均以「新建浏览器标签页」打开独立全屏页
  const openNew = () => window.open("/quotation-templates/new", "_blank");
  const openEdit = (tpl: QuotationTemplate) =>
    window.open(`/quotation-templates/${tpl.id}/edit`, "_blank");
  const openPreview = (tpl: QuotationTemplate) =>
    window.open(`/quotation-templates/${tpl.id}/preview`, "_blank");

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

  const filtered =
    docTypeFilter === "all"
      ? templates
      : templates.filter((tpl) => (tpl.docType || "quotation") === docTypeFilter);

  // ---- 列表态：单据模板设置表格 ----
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title="单据模板设置"
        description="将您的业务单据制作成模板后，可再用模板进行单据的导出"
        actions={
          <Button onClick={openNew} disabled={loading}>
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
                        <DropdownMenuItem onClick={() => openPreview(tpl)}>
                          <Eye className="size-4" />
                          预览
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(tpl)}>
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
