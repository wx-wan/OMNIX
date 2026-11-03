import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Archive, ArchiveRestore } from "lucide-react";

import { api } from "@/lib/api";
import { extractErrorDetail } from "@/lib/error";
import { toast } from "sonner";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ProductForm,
  EMPTY_PRODUCT,
  type ProductValues,
} from "@/components/crm/ProductForm";
import { ViewToggle, type ViewMode } from "@/components/common/ViewToggle";
import { Pagination } from "@/components/common/Pagination";

interface Product {
  id: string;
  description: string | null;
  mode: string | null;
  process: string | null;
  audience: string | null;
  category: string | null;
  price: number | null;
  costPrice: number | null;
  tax: number | null;
  quantity: number;
  image?: string | null;
  isRequirement?: boolean;
  archived?: boolean;
  // 是否被任一商机引用（Deal.productId 或 明细行 productId）；关联则不允许删除，只能归档
  linked?: boolean;
}

function formatPrice(n: number | null, unit?: string | null) {
  if (n == null) return "";
  return `¥${n.toLocaleString("zh-CN")}${unit ? ` / ${unit}` : ""}`;
}

export default function Products() {
  const { t } = useTranslation();
  const [list, setList] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [values, setValues] = useState<ProductValues>(EMPTY_PRODUCT);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // 卡片 / 列表 视图偏好（localStorage 持久化）
  const [view, setView] = useState<ViewMode>(() => {
    const v = typeof localStorage !== "undefined" ? localStorage.getItem("products-view") : null;
    return v === "grid" || v === "list" ? v : "grid";
  });
  useEffect(() => {
    localStorage.setItem("products-view", view);
  }, [view]);

  // 后端分页状态
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const load = (targetPage?: number) => {
    const next = targetPage && targetPage > 0 ? targetPage : page;
    setPage(next);
    api
      .get<unknown>("/products", {
        params: { includeArchived: true, page: next, pageSize },
      })
      .then((r) => {
        const body = r.data;
        if (Array.isArray(body)) {
          // 向后兼容：未分页时返回数组
          setList(body as Product[]);
          setTotal(body.length);
        } else {
          const paged = body as { data: Product[]; total: number };
          setList(paged.data);
          setTotal(paged.total);
        }
      })
      .catch(() => {
        setList([]);
        setTotal(0);
      });
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = list.filter((p) => showArchived || !p.archived);

  const handleCreate = async () => {
    if (!values.description.trim() || saving) return;
    setSaving(true);
    try {
      await api.post("/products", {
        ...values,
        description: values.description.trim(),
        price: values.price ? Number(values.price) : undefined,
        costPrice: values.costPrice ? Number(values.costPrice) : undefined,
        tax: values.tax ? Number(values.tax) : undefined,
        quantity: values.quantity ? Number(values.quantity) : undefined,
        image: values.image || undefined,
      });
      setOpen(false);
      setValues(EMPTY_PRODUCT);
      setError(false);
      load(1);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (p: Product) => {
    try {
      await api.patch(`/products/${p.id}/archive`, { archived: !p.archived });
      toast.success(
        (p.archived ? t("common.unarchive") : t("common.archive")) +
          " " +
          t("common.success"),
      );
      load();
    } catch (e) {
      toast.error(extractErrorDetail(e) || t("crm.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success(t("product.delete") + " " + t("common.success"));
      setDeleteTarget(null);
      load();
    } catch (e) {
      setDeleteTarget(null);
      toast.error(extractErrorDetail(e) || t("crm.saveFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack gap={4}>
      <PageMeta
        title={t("nav.products")}
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowArchived((v) => !v);
                load(1);
              }}
            >
              {showArchived ? t("common.hideArchived") : t("common.showArchived")}
            </Button>
            <Button
              onClick={() => {
                setError(false);
                setValues(EMPTY_PRODUCT);
                setOpen(true);
              }}
            >
              {t("product.add")}
            </Button>
          </div>
        }
      />

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("product.empty")}
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <Card
              key={p.id}
              className={p.archived ? "opacity-60" : ""}
            >
              {p.image && (
                <Image
                  src={p.image}
                  alt={p.description ?? ""}
                  ratio="16/9"
                  className="w-full rounded-t-xl"
                />
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {p.description}
                  {p.isRequirement && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                      {t("common.requirement")}
                    </span>
                  )}
                  {p.archived && (
                    <span className="rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {t("common.archived")}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto text-muted-foreground hover:text-foreground"
                    aria-label={p.archived ? t("common.unarchive") : t("common.archive")}
                    title={p.archived ? t("common.unarchive") : t("common.archive")}
                    onClick={() => handleArchive(p)}
                  >
                    {p.archived ? <ArchiveRestore /> : <Archive />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={t("product.delete")}
                    title={
                      p.linked ? t("common.deleteBlockedByDeal") : t("product.delete")
                    }
                    disabled={p.linked}
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                {p.category && <span>{p.category}</span>}
                {p.mode && <span>模式：{p.mode}</span>}
                {p.process && <span>工艺：{p.process}</span>}
                {p.audience && <span>受众：{p.audience}</span>}
                <span>
                  {formatPrice(p.price) || "—"}
                  {p.quantity ? ` × ${p.quantity}` : ""}
                </span>
                {p.costPrice != null && (
                  <span>成本价：{formatPrice(p.costPrice)}</span>
                )}
                {p.tax != null && <span>税项：{p.tax}%</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="w-14 px-3 py-2 text-left font-medium">{t("product.image")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("product.description")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("product.category")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("product.price")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("product.costPrice")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("product.tax")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("product.quantity")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("common.status")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr
                  key={p.id}
                  className={
                    "border-b border-border/60 last:border-0 hover:bg-muted/40" +
                    (p.archived ? " opacity-60" : "")
                  }
                >
                  <td className="px-3 py-2 align-middle">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.description ?? ""}
                        ratio="1/1"
                        className="size-10 rounded object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="font-medium text-foreground">{p.description}</div>
                  </td>
                  <td className="px-3 py-2 align-middle text-muted-foreground">
                    {p.category || "—"}
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    <div>{formatPrice(p.price) || "—"}</div>
                    {p.quantity ? (
                      <div className="text-xs text-muted-foreground">× {p.quantity}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right align-middle text-muted-foreground">
                    {p.costPrice != null ? formatPrice(p.costPrice) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right align-middle text-muted-foreground">
                    {p.tax != null ? `${p.tax}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right align-middle text-muted-foreground">
                    {p.quantity || "—"}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="flex flex-wrap gap-1">
                      {p.isRequirement && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                          {t("common.requirement")}
                        </span>
                      )}
                      {p.archived && (
                        <span className="rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          {t("common.archived")}
                        </span>
                      )}
                      {!p.isRequirement && !p.archived && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={p.archived ? t("common.unarchive") : t("common.archive")}
                        title={p.archived ? t("common.unarchive") : t("common.archive")}
                        onClick={() => handleArchive(p)}
                      >
                        {p.archived ? <ArchiveRestore /> : <Archive />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={t("product.delete")}
                        title={
                          p.linked ? t("common.deleteBlockedByDeal") : t("product.delete")
                        }
                        disabled={p.linked}
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page - 1}
          pageCount={Math.max(1, Math.ceil(total / pageSize))}
          onPageChange={(p) => load(p + 1)}
          total={total}
          pageSize={pageSize}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) setError(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("product.panel")}</DialogTitle>
            <DialogDescription>{t("product.empty")}</DialogDescription>
          </DialogHeader>
          <ProductForm values={values} onChange={setValues} />
          {error && <p className="text-sm text-red-500">{t("crm.createFailed")}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!values.description.trim() || saving} onClick={handleCreate}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除产品确认 */}
      <Dialog
        open={deleteTarget != null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("product.delete")}</DialogTitle>
            <DialogDescription>
              {t("product.deleteConfirm", { name: deleteTarget?.description ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
