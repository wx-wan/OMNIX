import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageMeta } from "@/components/layout/PageMeta";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeeItem {
  id: string;
  dealId: string;
  type: string;
  amount: number;
  note?: string | null;
  paidAt?: string | null;
  fundAccount?: string | null;
}

/** 费用类型标签配色（与看板阶段色同源）。 */
const TYPE_CHIP_CLS: Record<string, string> = {
  样品费: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  设计费: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "定金30%": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "尾款70%": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const typeChipCls = (type: string) =>
  TYPE_CHIP_CLS[type] ?? "bg-slate-500/10 text-slate-600 dark:text-slate-400";

function formatMoney(v: number): string {
  return `¥${v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Fees() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeeItem[]>([]);
  const [dealMap, setDealMap] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api.get<FeeItem[]>("/fees"),
      api.get<unknown>("/crm/deals"),
    ])
      .then(([feesRes, dealsRes]) => {
        if (!alive) return;
        const raw = (dealsRes as { data?: unknown }).data;
        const arr = Array.isArray(raw) ? raw : ((raw as { data?: unknown[] })?.data ?? []);
        const m: Record<string, string> = {};
        for (const d of arr as { id: string; name?: string }[]) {
          m[d.id] = d.name ?? d.id;
        }
        setItems(feesRes.data ?? []);
        setDealMap(m);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of items) m.set(f.type, (m.get(f.type) ?? 0) + 1);
    return m;
  }, [items]);

  const now = Date.now();
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  const periodMatch = (paidAt?: string | null) => {
    if (periodFilter === "all" || !paidAt) return periodFilter === "all";
    const ts = Date.parse(paidAt);
    if (Number.isNaN(ts)) return periodFilter === "all";
    switch (periodFilter) {
      case "last7":
        return ts >= now - 7 * 864e5;
      case "last30":
        return ts >= now - 30 * 864e5;
      case "last90":
        return ts >= now - 90 * 864e5;
      case "thisYear":
        return ts >= startOfYear;
      default:
        return true;
    }
  };

  const visibleItems = useMemo(
    () =>
      items.filter(
        (f) => (!typeFilter || f.type === typeFilter) && periodMatch(f.paidAt),
      ),
    [items, typeFilter, periodFilter],
  );

  const totalAmount = visibleItems.reduce((s, f) => s + (f.amount || 0), 0);

  const typeSubtotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of visibleItems) {
      m.set(f.type, (m.get(f.type) ?? 0) + (f.amount || 0));
    }
    return m;
  }, [visibleItems]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={t("crm.fees.globalTitle")}
        back={() => navigate("/crm")}
      />

      {/* 汇总卡片 */}
      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{t("crm.fees.total")}</p>
          <p className="font-heading text-xl font-semibold tabular-nums text-foreground">
            {formatMoney(totalAmount)}
          </p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">{t("crm.fees.count")}</p>
          <p className="font-heading text-xl font-semibold tabular-nums text-foreground">
            {visibleItems.length}
          </p>
        </Card>
        {[...typeCounts.keys()].map((tp) => (
          <Card key={tp} className="flex flex-col gap-1 p-4">
            <span
              className={`inline-block w-fit rounded px-1.5 py-0.5 text-[11px] font-medium ${typeChipCls(tp)}`}
            >
              {tp}
            </span>
            <p className="font-heading text-xl font-semibold tabular-nums text-foreground">
              {formatMoney(typeSubtotals.get(tp) ?? 0)}
            </p>
          </Card>
        ))}
      </div>

      {/* 明细列表 */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!typeFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
          >
            {t("crm.fees.all")}
            <span className="ml-1 tabular-nums opacity-70">{items.length}</span>
          </button>
          {[...typeCounts.entries()].map(([tp, n]) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTypeFilter(tp)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${typeFilter === tp ? typeChipCls(tp) + " ring-1 ring-inset ring-current/30" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {tp}
              <span className="tabular-nums opacity-70">{n}</span>
            </button>
          ))}
          <div className="ml-auto">
            <Select
              value={periodFilter}
              onValueChange={(v) => setPeriodFilter(v ?? "all")}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder={t("crm.fees.period")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("crm.fees.periodAll")}</SelectItem>
                <SelectItem value="last7">{t("crm.fees.periodLast7")}</SelectItem>
                <SelectItem value="last30">{t("crm.fees.periodLast30")}</SelectItem>
                <SelectItem value="last90">{t("crm.fees.periodLast90")}</SelectItem>
                <SelectItem value="thisYear">{t("crm.fees.periodThisYear")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("crm.fees.empty")}
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">{t("crm.fees.deal")}</th>
                  <th className="px-4 py-2 font-medium">{t("crm.fees.type")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("crm.fees.amount")}</th>
                  <th className="px-4 py-2 font-medium">{t("crm.fees.paidAt")}</th>
                  <th className="px-4 py-2 font-medium">{t("crm.fees.fundAccount")}</th>
                  <th className="px-4 py-2 font-medium">{t("crm.fees.note")}</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((f) => (
                  <tr
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/crm/deals/${f.dealId}/fees`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate(`/crm/deals/${f.dealId}/fees`);
                      }
                    }}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-foreground">
                        {dealMap[f.dealId] ?? f.dealId}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${typeChipCls(f.type)}`}
                      >
                        {f.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                      {formatMoney(f.amount)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {f.paidAt ? f.paidAt.slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {f.fundAccount ?? "—"}
                    </td>
                    <td className="max-w-[16rem] px-4 py-2.5 text-muted-foreground">
                      <span className="block truncate" title={f.note ?? ""}>
                        {f.note || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
