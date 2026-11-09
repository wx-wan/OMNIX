import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, Archive, ArchiveRestore, FolderTree, Pencil } from "lucide-react";

import { api } from "@/lib/api";
import { extractErrorDetail } from "@/lib/error";
import { toast } from "sonner";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Picker } from "@/components/common/Picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  // PLM
  status?: string;
  partNo?: string | null;
  revision?: string;
  drawings?: { name: string; url: string }[] | null;
  // 是否被任一商机引用（Deal.productId 或 明细行 productId）；关联则不允许删除，只能归档
  linked?: boolean;
}

const PRODUCT_STATUS_KEYS = [
  "requirement",
  "designing",
  "reviewing",
  "released",
  "obsolete",
] as const;

const PRODUCT_STATUS_CHIP: Record<string, string> = {
  requirement: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  designing: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  reviewing: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  released: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  obsolete: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

function formatPrice(n: number | null, unit?: string | null) {
  if (n == null) return "";
  return `¥${n.toLocaleString("zh-CN")}${unit ? ` / ${unit}` : ""}`;
}

export default function Products() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [list, setList] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [values, setValues] = useState<ProductValues>(EMPTY_PRODUCT);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // —— 分类管理 ——
  type CatNode = {
    id: string;
    name: string;
    parentId: string | null;
    position: number;
    specTemplate: unknown;
    children: CatNode[];
  };
  const [catTree, setCatTree] = useState<CatNode[]>([]);
  const [catDialog, setCatDialog] = useState(false);
  const [catForm, setCatForm] = useState({
    id: "",
    name: "",
    parentId: "",
    position: 0,
  });
  const [catSaving, setCatSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const r = await api.get<CatNode[]>("/product-categories");
      setCatTree(r.data ?? []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const catFlat = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    const walk = (nodes: CatNode[], prefix: string) => {
      for (const n of nodes) {
        const label = prefix ? `${prefix} / ${n.name}` : n.name;
        out.push({ id: n.id, label });
        walk(n.children, label);
      }
    };
    walk(catTree, "");
    return out;
  }, [catTree]);

  const openCat = (node?: CatNode) => {
    if (node)
      setCatForm({
        id: node.id,
        name: node.name,
        parentId: node.parentId ?? "",
        position: node.position,
      });
    else setCatForm({ id: "", name: "", parentId: "", position: 0 });
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) return toast.error(t("common.required"));
    setCatSaving(true);
    try {
      if (catForm.id) {
        await api.patch(`/product-categories/${catForm.id}`, {
          name: catForm.name,
          parentId: catForm.parentId || null,
          position: catForm.position,
        });
      } else {
        await api.post("/product-categories", {
          name: catForm.name,
          parentId: catForm.parentId || null,
          position: catForm.position,
        });
      }
      setCatForm({ id: "", name: "", parentId: "", position: 0 });
      await loadCategories();
      toast.success(t("common.success"));
    } catch {
      toast.error(t("crm.saveFailed"));
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCat = async (id: string) => {
    try {
      await api.delete(`/product-categories/${id}`);
      await loadCategories();
      toast.success(t("common.success"));
    } catch {
      toast.error(t("crm.saveFailed"));
    }
  };

  const renderTree = (nodes: CatNode[], depth: number): ReactNode =>
    nodes.map((n) => (
      <div key={n.id}>
        <div
          className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/40"
          style={{ paddingLeft: 8 + depth * 14 }}
        >
          <span className="truncate text-sm text-foreground">{n.name}</span>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => openCat(n)}
              aria-label={t("common.edit")}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive"
              onClick={() => deleteCat(n.id)}
              aria-label={t("common.delete")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {n.children.length > 0 && renderTree(n.children, depth + 1)}
      </div>
    ));

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

  const visible = useMemo(
    () =>
      list.filter(
        (p) =>
          (showArchived || !p.archived) &&
          (statusFilter === "all" || (p.status ?? "requirement") === statusFilter),
      ),
    [list, showArchived, statusFilter],
  );

  const statusLabel = (s: string) =>
    (PRODUCT_STATUS_KEYS as readonly string[]).includes(s)
      ? t(`product.status.${s}`)
      : s;

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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("product.status.all")}</SelectItem>
                {PRODUCT_STATUS_KEYS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`product.status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              variant="outline"
              size="sm"
              onClick={() => {
                void loadCategories();
                setCatDialog(true);
              }}
            >
              <FolderTree className="size-4" />
              {t("product.categoryManage")}
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
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/products/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/products/${p.id}`);
              }}
              className={
                "cursor-pointer transition hover:shadow-md " +
                (p.archived ? "opacity-60" : "")
              }
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
                  {p.partNo && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {p.partNo} · {p.revision ?? "A"}
                    </span>
                  )}
                  {p.status && (
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${PRODUCT_STATUS_CHIP[p.status] ?? ""}`}
                    >
                      {statusLabel(p.status)}
                    </span>
                  )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(p);
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(p);
                    }}
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
                  onClick={() => navigate(`/products/${p.id}`)}
                  className={
                    "cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40" +
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
                    {p.partNo && (
                      <div className="text-xs text-muted-foreground">
                        {p.partNo} · {p.revision ?? "A"}
                      </div>
                    )}
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
                    <div className="flex flex-wrap items-center gap-1">
                      {p.status && (
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${PRODUCT_STATUS_CHIP[p.status] ?? ""}`}
                        >
                          {statusLabel(p.status)}
                        </span>
                      )}
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
                      {!p.status && !p.isRequirement && !p.archived && (
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(p);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(p);
                        }}
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

      {/* 分类管理 */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("product.categoryManage")}</DialogTitle>
            <DialogDescription>{t("product.categoryManageHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
              <Label>{catForm.id ? t("product.category") : t("product.categoryManage")}</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder={t("product.categoryManage")}
              />
              <div className="flex flex-col gap-1.5">
                <Label>{t("product.category")}</Label>
                <Picker
                  records={catFlat.filter((c) => c.id !== catForm.id)}
                  value={catForm.parentId || null}
                  searchMoreTitle={t("product.category")}
                  placeholder={t("product.noCategory")}
                  onChange={(rec) =>
                    setCatForm({ ...catForm, parentId: rec?.id ?? "" })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveCat} disabled={catSaving}>
                  {t("common.confirm")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setCatForm({ id: "", name: "", parentId: "", position: 0 })
                  }
                >
                  {t("common.reset")}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {catTree.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("product.categoryEmpty")}
                </p>
              ) : (
                renderTree(catTree, 0)
              )}
            </div>
          </div>
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
