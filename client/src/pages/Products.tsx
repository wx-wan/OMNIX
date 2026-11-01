import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const load = () => {
    api
      .get<Product[]>("/products")
      .then((r) => setList(r.data))
      .catch(() => setList([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <Stack gap={4}>
      <PageMeta
        title={t("nav.products")}
        actions={
          <Button
            onClick={() => {
              setError(false);
              setValues(EMPTY_PRODUCT);
              setOpen(true);
            }}
          >
            {t("product.add")}
          </Button>
        }
      />

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("product.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.description}</CardTitle>
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
    </Stack>
  );
}
