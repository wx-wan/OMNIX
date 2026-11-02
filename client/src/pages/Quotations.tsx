import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuotationListItem {
  id: string;
  number: string;
  dealId: string;
  amount: number | null;
  validUntil: string | null;
  deal: { id: string; title: string } | null;
  contact: { id: string; name: string; country: string | null } | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatMoney(v: number | null): string {
  if (v == null) return "—";
  return `¥${v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Quotations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dealId = searchParams.get("dealId") ?? "";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<QuotationListItem[]>([]);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<QuotationListItem[]>("/quotations", {
        params: dealId ? { dealId } : undefined,
      })
      .then((r) => setRows(r.data))
      .catch(() => toast.error(t("quotation.loadFailed")))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [dealId]);

  // 从商机产物栏进入（?dealId=）：可直接再生成一份报价单（同一商机可多单）
  const createForDeal = async () => {
    if (!dealId) return;
    setCreating(true);
    try {
      const r = await api.post<{ id: string; number: string }>("/quotations", {
        dealId,
      });
      toast.success(t("quotation.created", { number: r.data.number }));
      navigate(`/quotations/${r.data.id}`);
    } catch (e) {
      console.error("[Quotations] create failed:", e);
      toast.error(t("quotation.createFailed"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack gap={6}>
      <PageMeta
        title={t("quotation.listTitle")}
        actions={
          dealId ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t("quotation.dealFilterActive")}</Badge>
              <Button variant="outline" size="sm" onClick={() => setSearchParams({})}>
                {t("quotation.clearFilter")}
              </Button>
              <Button size="sm" onClick={() => void createForDeal()} disabled={creating}>
                {t("quotation.new")}
              </Button>
            </div>
          ) : undefined
        }
      />

      <Section noPadding>
        <div className="flex flex-col gap-1">
          {loading && (
            <p className="px-5 py-6 text-sm text-muted-foreground">{t("auth.loading")}</p>
          )}
          {!loading && rows.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">{t("quotation.empty")}</p>
          )}
          {!loading &&
            rows.map((q) => (
              <div
                key={q.id}
                className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50"
                onClick={() => navigate(`/quotations/${q.id}`)}
              >
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold text-foreground">
                    {q.number}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {q.contact?.name ?? "—"}
                    {q.contact?.country ? ` · ${q.contact.country}` : ""}
                    {q.deal?.title ? ` · ${q.deal.title}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {t("quotation.validUntil")} {formatDate(q.validUntil)}
                  </span>
                  <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                    {formatMoney(q.amount)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </Section>
    </Stack>
  );
}
