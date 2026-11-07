import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { UniverSheetsHandle } from "@/components/demo/UniverSheetsDemo";
import { expandSnapshot } from "@/lib/univerLoop";
import { computeTotals, type TemplateData } from "@/lib/quotationFields";
import { downloadUniverSnapshot, snapshotToXlsxBase64 } from "@/lib/univerToXlsx";
import {
  listQuotationTemplates,
  sendQuotationEmail,
  type QuotationTemplate,
} from "@/api/quotationTemplates";

// 重型 Univer preset 仅在本页动态加载（新标签页独立 chunk，不拖累主应用首屏）
const UniverSheetsDemo = lazy(() => import("@/components/demo/UniverSheetsDemo"));

/** 报价单详情（后端 GET /quotations/:id 返回） */
interface QuotationRecord {
  id: string;
  number: string;
  contact?: {
    name?: string;
    company?: string;
    parent?: { name?: string } | null;
    country?: string;
    email?: string;
    phone?: string;
  } | null;
  shippingAddress?: string;
  validUntil?: string;
  paymentTerms?: string;
  tradeTerms?: string;
  deliveryDate?: string;
  notes?: string;
  priceIncludeTax?: boolean;
  templateId?: string | null;
  documentJson?: string | null;
  linesJson?: string | null;
}

interface OrderLine {
  type?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  discount?: number;
  taxRate?: number;
}

const SNIPPETS_KEY = "omnix.quotation-snippets";

/** 从 localStorage 读取快捷文本 */
function loadSnippets(): string[] {
  try {
    const raw = localStorage.getItem(SNIPPETS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveSnippets(list: string[]) {
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(list));
}

/** 报价单记录 → 模板渲染数据（客户/单据字段真实值 + 明细行派生金额） */
function buildTemplateData(q: QuotationRecord, linesRaw: OrderLine[]): TemplateData {
  const raw = (linesRaw ?? [])
    .filter((l) => l.type === "product")
    .map((l) => ({
      name: l.name ?? "",
      description: l.description ?? "",
      quantity: typeof l.quantity === "number" ? l.quantity : 0,
      unit: l.unit ?? "",
      price: l.price ?? 0,
      discount: l.discount ?? 0,
      taxRate: l.taxRate ?? 0,
    }));
  const { lines, totals } = computeTotals(raw, q.priceIncludeTax ?? false);
  const c = q.contact ?? null;
  return {
    customer: c
      ? {
          name: c.name ?? "",
          company: c.parent?.name ?? c.company ?? "",
          country: c.country ?? "",
          email: c.email ?? "",
          phone: c.phone ?? "",
          website: "",
          customerType: "",
        }
      : null,
    quotation: {
      number: q.number ?? "",
      date: new Date().toISOString().slice(0, 10),
      validUntil: (q.validUntil ?? "").slice(0, 10),
      deliveryDate: (q.deliveryDate ?? "").slice(0, 10),
      paymentTerms: q.paymentTerms ?? "",
      tradeTerms: q.tradeTerms ?? "",
      shippingAddress: q.shippingAddress ?? "",
      notes: q.notes ?? "",
      priceIncludeTax: q.priceIncludeTax ?? false,
    },
    totals,
    lines,
  };
}

/**
 * 报价单导出页（独立新标签页，参考小满导出器布局）：
 *  - 左侧：模板库 / 快捷文本 侧栏（点模板即套用；快捷文本一键插入光标单元格）；
 *  - 顶部：返回、标题、Excel|Pdf 切换、发送、下载；
 *  - 中间：Univer 画布展示展开成品（系统字段真实值 + 循环区域按明细行展开），可编辑内容；
 *  - 不持久化按单快照：每次都从最新模板 + 当前明细数据重新生成，模板编辑后导出立即生效，
 *    手工改稿仅当次会话有效（关闭页面后回退模板）。
 */
export default function QuotationExportPage() {
  const { id } = useParams<{ id: string }>();
  const univerRef = useRef<UniverSheetsHandle>(null);

  const [loading, setLoading] = useState(true);
  const [tplData, setTplData] = useState<TemplateData | null>(null);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  // 模板列表就绪门控：决定画布初始快照前必须等它（避免按残留旧值挂载）
  const [tplLoaded, setTplLoaded] = useState(false);
  // 报价单加载失败（不存在/已删除/网络错误）：阻断画布渲染并给出明确错误界面
  const [loadError, setLoadError] = useState<string | null>(null);

  // 侧栏
  const [sideTab, setSideTab] = useState<"templates" | "snippets">("templates");
  const [search, setSearch] = useState("");
  const [snippets, setSnippets] = useState<string[]>(() => loadSnippets());
  const [newSnippet, setNewSnippet] = useState("");

  // 发送对话框
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendAttach, setSendAttach] = useState(true);
  const [sending, setSending] = useState(false);

  // 画布基准快照：始终取当前套用模板（展开成品）。已移除「按单冻结副本」持久化——
  // 每次都从最新模板 + 当前明细数据重新生成，模板编辑后导出立即生效，手工改稿仅当次会话有效。
  const baseSnapshot = useMemo(() => {
    const tpl = templates.find((x) => x.id === selectedTemplateId);
    return tpl?.sheetSnapshot;
  }, [templates, selectedTemplateId]);

  // 展开成品：系统字段解析为真实值、循环区域按明细行逐行展开
  const expandedSnapshot = useMemo(() => {
    if (!baseSnapshot) return undefined;
    try {
      return expandSnapshot(baseSnapshot, tplData?.lines ?? [], tplData ?? undefined);
    } catch (err) {
      console.error("展开循环明细失败", err);
      return baseSnapshot;
    }
  }, [baseSnapshot, tplData]);

  // 初始加载：报价单数据 + 模板列表（无冻结副本时自动套用当前/默认模板）
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const { data: q } = await api.get<QuotationRecord>(`/quotations/${id}`);
        if (!alive) return;
        let linesRaw: OrderLine[] = [];
        try {
          const parsed = JSON.parse(q.linesJson ?? "[]");
          if (Array.isArray(parsed)) linesRaw = parsed;
        } catch {
          /* 忽略 */
        }

        setTplData(buildTemplateData(q, linesRaw));
        setSelectedTemplateId(q.templateId ?? null);
        try {
          const list = await listQuotationTemplates("quotation");
          if (!alive) return;
          setTemplates(list);
          if (list.length > 0) {
            const target =
              (q.templateId && list.find((x) => x.id === q.templateId)) ||
              list.find((x) => x.name === "默认模板") ||
              list[0];
            if (target) setSelectedTemplateId(target.id);
          }
        } catch {
          if (alive) toast.error("模板列表加载失败");
        }
      } catch (err: unknown) {
        if (!alive) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        setLoadError(
          status === 404
            ? "该报价单不存在或已被删除，请从报价单列表重新进入"
            : "报价单加载失败，请稍后重试",
        );
      } finally {
        if (alive) {
          setTplLoaded(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleChooseTemplate = (tpl: QuotationTemplate) => {
    // 报价单数据未就绪时不套用（避免按 0 明细行展开）
    if (!tplData) return;
    setSelectedTemplateId(tpl.id);
    univerRef.current?.loadSnapshot(expandSnapshot(tpl.sheetSnapshot, tplData.lines, tplData));
  };

  const handleBack = () => {
    window.close();
    window.history.back();
  };

  const handleDownload = async () => {
    const num = tplData?.quotation.number;
    await univerRef.current?.exportXlsx(num ? `${num}.xlsx` : "quotation.xlsx");
    toast.success("已开始下载 Excel");
  };

  const openSendDialog = () => {
    setSendTo(tplData?.customer?.email ?? "");
    setSendSubject(`报价单 ${tplData?.quotation.number ?? ""}`.trim());
    setSendBody(
      `您好${tplData?.customer?.name ? ` ${tplData.customer.name}` : ""}：\n\n附件是我司为您准备的报价单，请查收。如有任何疑问欢迎随时联系。\n\n顺祝商祺！`,
    );
    setSendOpen(true);
  };

  const handleSend = async () => {
    if (!id) return;
    if (!sendTo.trim()) {
      toast.error("请填写收件人邮箱");
      return;
    }
    setSending(true);
    try {
      let attachmentBase64: string | undefined;
      if (sendAttach) {
        const snap = await univerRef.current?.getSnapshot();
        attachmentBase64 = (await snapshotToXlsxBase64(snap)) ?? undefined;
      }
      await sendQuotationEmail(id, {
        to: sendTo.trim(),
        subject: sendSubject.trim() || `报价单 ${tplData?.quotation.number ?? ""}`.trim(),
        body: sendBody,
        attachmentBase64,
        attachmentName: `${tplData?.quotation.number ?? "quotation"}.xlsx`,
      });
      toast.success("报价单已发送");
      setSendOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "发送失败，请稍后重试";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const addSnippet = () => {
    const text = newSnippet.trim();
    if (!text) return;
    const next = [text, ...snippets];
    setSnippets(next);
    saveSnippets(next);
    setNewSnippet("");
  };

  const removeSnippet = (idx: number) => {
    const next = snippets.filter((_, i) => i !== idx);
    setSnippets(next);
    saveSnippets(next);
  };

  const selectedTpl = templates.find((x) => x.id === selectedTemplateId);
  const headerTitle = `导出报价单-${selectedTpl?.name ?? tplData?.quotation.number ?? "报价单"}`;

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* 顶栏：返回 / 标题 / Excel|Pdf / 发送 / 下载 */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
        <Button variant="ghost" size="icon" className="size-8" onClick={handleBack} title="返回">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-semibold">{headerTitle}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* 导出格式切换（PDF 待接入，先占位提示） */}
          <div className="flex items-center rounded-md border border-border p-0.5">
            <button
              type="button"
              className="rounded-sm bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              Excel
            </button>
            <button
              type="button"
              className="rounded-sm px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
              onClick={() => toast.info("PDF 导出即将上线，请先使用 Excel 格式")}
            >
              Pdf
            </button>
          </div>
          <Button size="sm" variant="outline" className="gap-1" onClick={openSendDialog}>
            <Send className="size-3.5" />
            发送
          </Button>
          <Button size="sm" className="gap-1" onClick={handleDownload}>
            <Download className="size-3.5" />
            下载
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 左侧栏：模板库 / 快捷文本 */}
        <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
          <Tabs value={sideTab} onValueChange={(v) => setSideTab(v as "templates" | "snippets")} className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b p-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates" className="text-xs">模板库</TabsTrigger>
                <TabsTrigger value="snippets" className="text-xs">快捷文本</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="templates" className="mt-0 flex min-h-0 flex-1 flex-col">
              <div className="relative p-2">
                <Search className="absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {loading ? (
                  <div className="flex flex-col gap-2 p-1">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">暂无模板，可点击下方「添加公司模板」新建</p>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {filteredTemplates.map((tpl) => (
                      <li key={tpl.id}>
                        <button
                          type="button"
                          onClick={() => handleChooseTemplate(tpl)}
                          className={`w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-accent ${
                            tpl.id === selectedTemplateId ? "bg-accent" : ""
                          }`}
                        >
                          <span
                            className={`block truncate text-xs ${
                              tpl.id === selectedTemplateId
                                ? "font-semibold text-primary"
                                : "text-foreground"
                            }`}
                          >
                            {tpl.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">
                            {new Date(tpl.updatedAt).toLocaleDateString("zh-CN")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            <TabsContent value="snippets" className="mt-0 flex min-h-0 flex-1 flex-col">
              <div className="flex gap-1 p-2">
                <Input
                  value={newSnippet}
                  onChange={(e) => setNewSnippet(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSnippet()}
                  placeholder="输入常用文本"
                  className="h-8 text-xs"
                />
                <Button size="icon" className="size-8 shrink-0" onClick={addSnippet} title="添加">
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {snippets.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">
                    暂无快捷文本。添加后点击即可插入画布当前选中单元格。
                  </p>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {snippets.map((s, i) => (
                      <li key={`${i}-${s.slice(0, 8)}`} className="group flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => univerRef.current?.insertText(s)}
                          className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                          title={s}
                        >
                          {s}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSnippet(i)}
                          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          title="删除"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-1 text-xs text-muted-foreground"
              onClick={() => window.open("/quotation-templates", "_blank")}
            >
              <Plus className="size-3.5" />
              添加公司模板
            </Button>
          </div>
        </aside>

        {/* 中间：Univer 画布（展开成品，可编辑列表内容） */}
        <main className="relative min-h-0 min-w-0 flex-1 p-3">
          {loading || !tplLoaded ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <TriangleAlert className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="size-3.5" />
                返回
              </Button>
            </div>
          ) : expandedSnapshot ? (
            <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
              <UniverSheetsDemo
                ref={univerRef}
                data={tplData ?? undefined}
                initialSnapshot={expandedSnapshot}
                fill
                hidePanel
              />
            </Suspense>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              暂无可用模板，请点击左侧「添加公司模板」新建模板后重试
            </div>
          )}
        </main>
      </div>

      {/* 发送对话框 */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发送报价单</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="send-to" className="text-xs">收件人邮箱</Label>
              <Input
                id="send-to"
                type="email"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="send-subject" className="text-xs">主题</Label>
              <Input
                id="send-subject"
                value={sendSubject}
                onChange={(e) => setSendSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="send-body" className="text-xs">正文</Label>
              <Textarea
                id="send-body"
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                rows={6}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={sendAttach} onCheckedChange={(v) => setSendAttach(v === true)} />
              附上 Excel 文件（当前画布内容）
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)} disabled={sending}>
              取消
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "发送中…" : "发送"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
