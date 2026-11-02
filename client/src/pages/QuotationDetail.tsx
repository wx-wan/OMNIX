import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageMeta } from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PillToggle } from "@/components/common/PillToggle";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Chatter, type ChatterMessage } from "@/components/chatter/Chatter";
import { OrderLinesTable, type OrderLine } from "@/components/crm/OrderLinesTable";

interface QuotationDetailData {
  id: string;
  number: string;
  dealId: string;
  amount: number | null;
  linesJson: string | null;
  shippingAddress: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  validUntil: string | null;
  deliveryDate: string | null;
  deal: { id: string; title: string } | null;
  contact: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
  } | null;
}

/** ISO 日期 → input[type=date] 用的 yyyy-mm-dd。 */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** input[type=date] 的 yyyy-mm-dd → ISO 串（空串返回 undefined 表示不修改）。 */
function fromDateInput(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export default function QuotationDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuotationDetailData | null>(null);

  // 可编辑字段
  const [shippingAddress, setShippingAddress] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [priceIncludeTax, setPriceIncludeTax] = useState(false);

  const [saving, setSaving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // Chatter 状态（与 DealForm 同款瀑布流）
  const [initialChatter, setInitialChatter] = useState<ChatterMessage[] | null>(null);
  const [chatterHasMore, setChatterHasMore] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<QuotationDetailData>(`/quotations/${id}`),
      api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
        `/quotations/${id}/chatter?limit=30`,
      ),
    ])
      .then(([q, c]) => {
        if (!alive) return;
        setDetail(q.data);
        setShippingAddress(q.data.shippingAddress ?? "");
        setValidUntil(toDateInput(q.data.validUntil));
        setPaymentTerms(q.data.paymentTerms ?? "");
        setDeliveryDate(toDateInput(q.data.deliveryDate));
        setNotes(q.data.notes ?? "");
        try {
          const parsed = JSON.parse(q.data.linesJson ?? "[]") as OrderLine[];
          setLines(Array.isArray(parsed) ? parsed : []);
        } catch {
          setLines([]);
        }
        setInitialChatter(c.data.messages);
        setChatterHasMore(c.data.hasMore);
      })
      .catch(() => {
        if (alive) setError(t("quotation.notFound"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOlderChatter = async (oldest: ChatterMessage) => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/quotations/${id}/chatter?limit=30&before=${encodeURIComponent(oldest.createdAt ?? "")}`,
    );
    setChatterHasMore(r.data.hasMore);
    return { messages: r.data.messages, hasMore: r.data.hasMore };
  };

  const loadLatestChatter = async () => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/quotations/${id}/chatter?limit=30`,
    );
    setChatterHasMore(r.data.hasMore);
    return { messages: r.data.messages, hasMore: r.data.hasMore };
  };

  const handleChatterSend = async (text: string): Promise<ChatterMessage | void> => {
    if (!id) return;
    const r = await api.post<ChatterMessage>(`/quotations/${id}/chatter`, { text });
    return r.data;
  };

  const handleChatterRecall = async (msgId: string) => {
    if (!id) return;
    try {
      await api.delete(`/quotations/${id}/chatter/${msgId}`);
      setRefreshToken((k) => k + 1);
    } catch (e) {
      console.error("[QuotationDetail] recall chatter failed:", e);
      toast.error(t("chatter.recallFailed"));
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.patch(`/quotations/${id}`, {
        shippingAddress,
        paymentTerms,
        notes,
        validUntil: fromDateInput(validUntil),
        deliveryDate: fromDateInput(deliveryDate),
        lines,
      });
      toast.success(t("quotation.saved"));
      // 明细变更会由后端写一条 Chatter 操作记录，增量刷新讨论区
      setRefreshToken((k) => k + 1);
    } catch (e) {
      console.error("[QuotationDetail] save failed:", e);
      toast.error(t("quotation.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  const contact = detail?.contact ?? null;

  const headerTitle = useMemo(() => detail?.number ?? "", [detail]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("auth.loading")}
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {error ?? t("quotation.notFound")}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={headerTitle}
        back={() => navigate("/quotations")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-10">
        {/* 报价单主体（6） */}
        <Card className="flex min-h-0 flex-col lg:col-span-6">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
            {/* 单号 */}
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {detail.number}
            </h1>

            {/* 客户 / 收货地址 ｜ 有效期 / 付款条款 / 交付日期 */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">{t("quotation.customer")}</span>
                <p className="text-sm font-medium text-foreground">
                  {contact?.name ?? "—"}
                </p>
                {contact?.company && (
                  <p className="text-xs text-muted-foreground">{contact.company}</p>
                )}
                {contact?.country && (
                  <p className="text-xs text-muted-foreground">{contact.country}</p>
                )}
                <Label className="mt-2 text-xs text-muted-foreground">
                  {t("quotation.shippingAddress")}
                </Label>
                <Textarea
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder={contact?.country ?? ""}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("quotation.validUntil")}
                  </Label>
                  <DatePicker
                    value={validUntil ? new Date(`${validUntil}T00:00:00`) : null}
                    onChange={(d) =>
                      setValidUntil(d ? d.toISOString().slice(0, 10) : "")
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("quotation.paymentTerms")}
                  </Label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder={t("quotation.paymentTerms")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("quotation.deliveryDate")}
                  </Label>
                  <DatePicker
                    value={deliveryDate ? new Date(`${deliveryDate}T00:00:00`) : null}
                    onChange={(d) =>
                      setDeliveryDate(d ? d.toISOString().slice(0, 10) : "")
                    }
                  />
                </div>
              </div>
            </div>

            {/* 订单明细 / 备注：Tab 切换 + 右侧含税/不含税胶囊（仅明细 Tab 显示） */}
            <Tabs
              defaultValue="lines"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="lines">{t("quotation.tabLines")}</TabsTrigger>
                  <TabsTrigger value="notes">{t("quotation.tabNotes")}</TabsTrigger>
                </TabsList>
                <PillToggle
                  options={[
                    { value: "excluded", label: t("orderLines.taxExcluded") },
                    { value: "included", label: t("orderLines.taxIncluded") },
                  ]}
                  value={priceIncludeTax ? "included" : "excluded"}
                  onChange={(v) => setPriceIncludeTax(v === "included")}
                />
              </div>

              <TabsContent value="lines" className="flex flex-col gap-3">
                <OrderLinesTable
                  products={[]}
                  lines={lines}
                  onLinesChange={setLines}
                  currency="¥"
                  priceIncludeTax={priceIncludeTax}
                />
              </TabsContent>

              <TabsContent value="notes" className="flex flex-col gap-1.5">
                <Textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("quotation.notesPlaceholder")}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* 底部操作栏：与商机详情一致，置于左侧卡片下方、靠右 */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t p-4">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {t("common.save")}
            </Button>
          </div>
        </Card>

        {/* Chatter（4） */}
        <div className="min-h-0 lg:col-span-4">
          {initialChatter && id && (
            <Chatter
              key={id}
              fill
              className="h-full"
              initialMessages={initialChatter}
              hasMore={chatterHasMore}
              currentUser={user?.name}
              onSend={handleChatterSend}
              onRecall={handleChatterRecall}
              onLoadOlder={loadOlderChatter}
              onLoadLatest={loadLatestChatter}
              refreshToken={refreshToken}
            />
          )}
        </div>
      </div>
    </div>
  );
}
