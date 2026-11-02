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

  const load = () => {
    api
      .get<Product[]>("/products", { params: { includeArchived: true } })
      .then((r) => setList(r.data))
      .catch(() => setList([]));
  };

  useEffect(() => {
    load();
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
      load();
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
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
      ) : (
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
