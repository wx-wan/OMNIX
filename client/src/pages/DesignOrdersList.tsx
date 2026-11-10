import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/badge";

interface DesignOrderListItem {
  id: string;
  dealId: string;
  productName: string;
  productType: string;
  status: string;
  sampleFee: boolean;
  dueDate: string | null;
  assistant?: { id: string; name: string } | null;
}

const DESIGN_STATUS_KEYS = [
  "draft",
  "designing",
  "pending_review",
  "approved",
  "rejected",
] as const;

// 与 DesignOrders 页同源的状态配色
const STATUS_CHIP: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  designing: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatMoney(v: number | null): string {
  if (v == null) return "—";
  return `¥${v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DesignOrdersList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dealId = searchParams.get("dealId") ?? "";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DesignOrderListItem[]>([]);
  const [dealMap, setDealMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api.get<DesignOrderListItem[]>("/design-orders", {
        params: dealId ? { dealId } : undefined,
      }),
      // 商机标题映射：后端无 GET /crm/deals 列表端点，用看板数据（阶段→商机）扁平化
      api.get<{ id: string; deals?: { id: string; title?: string }[] }[]>(
        "/crm/board",
      ),
    ])
      .then(([listRes, boardRes]) => {
        if (!alive) return;
        const arr = (boardRes.data ?? []).flatMap((s) => s.deals ?? []);
        const m: Record<string, string> = {};
        for (const d of arr) {
          m[d.id] = d.title ?? d.id;
        }
        setRows(listRes.data ?? []);
        setDealMap(m);
      })
      .catch(() => toast.error(t("crm.designOrders.loadFailed")))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return m;
  }, [rows]);

  const visibleRows = useMemo(
    () => (statusFilter ? rows.filter((r) => r.status === statusFilter) : rows),
    [rows, statusFilter],
  );

  const dealTitle = dealId ? dealMap[dealId] : undefined;

  const statusLabel = (s: string) =>
    (DESIGN_STATUS_KEYS as readonly string[]).includes(s)
      ? t(`crm.designOrders.${s}`)
      : s;

  return (
    <Stack gap={6}>
      <PageMeta
        title={t("crm.designOrders.title")}
        back={dealId ? () => navigate(`/crm/deals/${dealId}`) : undefined}
        actions={
          dealId ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="max-w-48 truncate">
                {dealTitle ?? t("crm.designOrders.dealFilterActive")}
              </Badge>
              <ButtonClearFilter onClick={() => setSearchParams({})} />
            </div>
          ) : undefined
        }
      />

      {/* 状态筛选（仿费用/设计单页的 chip 筛选） */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={!statusFilter}
          onClick={() => setStatusFilter(null)}
          label={t("crm.designOrders.all")}
          count={rows.length}
        />
        {DESIGN_STATUS_KEYS.map((s) =>
          statusCounts.has(s) ? (
            <FilterChip
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={statusLabel(s)}
              count={statusCounts.get(s) ?? 0}
            />
          ) : null,
        )}
      </div>

      <Section noPadding>
        <div className="flex flex-col gap-1">
          {loading && (
            <p className="px-5 py-6 text-sm text-muted-foreground">{t("auth.loading")}</p>
          )}
          {!loading && rows.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              {t("crm.designOrders.empty")}
            </p>
          )}
          {!loading &&
            visibleRows.map((r) => (
              <div
                key={r.id}
                className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50"
                onClick={() => navigate(`/crm/deals/${r.dealId}/design-orders`)}
              >
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold text-foreground">
                    {r.productName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.productType}
                    {r.assistant ? ` · ${r.assistant.name}` : ""}
                    {dealMap[r.dealId] ? ` · ${dealMap[r.dealId]}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`hidden rounded px-1.5 py-0.5 text-[11px] font-medium sm:inline ${
                      STATUS_CHIP[r.status] ??
                      "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {statusLabel(r.status)}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {t("crm.designOrders.dueDate")} {formatDate(r.dueDate)}
                  </span>
                  <span
                    className={`text-sm font-medium ${r.sampleFee ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {r.sampleFee ? t("crm.designOrders.sampleFeeYes") : "—"}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </Section>
    </Stack>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {label}
      <span className="ml-1 tabular-nums opacity-70">{count}</span>
    </button>
  );
}

function ButtonClearFilter({ onClick }: { onClick: () => void }) {
  // 轻量「清除筛选」按钮（仿 Quotations 产物栏）
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60"
    >
      {t("quotation.clearFilter")}
    </button>
  );
}
