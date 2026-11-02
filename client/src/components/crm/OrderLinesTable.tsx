"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Trash2,
  Layers,
  StickyNote,
  Store,
  Search,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { SelectRecord } from "@/components/common/SearchableSelect";
import { Picker } from "@/components/common/Picker";
import { InputNumber } from "@/components/common/InputNumber";
import { Input } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import { ImageUpload } from "@/components/ui/image-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn } from "cn";

export type OrderRowType = "product" | "combo" | "note";

export interface OrderLine {
  id: string;
  type: OrderRowType;
  /** 产品行所属的组合（组合容器）id，null 表示顶层 */
  parentId?: string | null;
  productId?: string | null;
  description: string;
  /** 组合标题 / 备注文本 */
  name: string;
  /** 数量，可为空（未填写） */
  quantity: number | "";
  unit: string;
  price: number;
  /** 成本价（元）—— 归属产品库，新建/选品时落产品表；行上记录便于单据展示 */
  costPrice: number;
  /** 税率（%） */
  taxRate: number;
  /** 关联税项记录 id（打开「搜索: 税项」弹窗选择），null 表示未选择 */
  taxId?: string | null;
  /** 折扣（%） */
  discount: number;
  /** 产品需求图片（每行独立上传，存 URL） */
  image?: string;
}

type DropPos = "before" | "after" | "inside";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Math.random());
}

function makeRow(type: OrderRowType): OrderLine {
  // 产品行默认带税项：13% 货 专票（与 DealForm.emptyLine 一致）
  const isProduct = type === "product";
  return {
    id: uid(),
    type,
    parentId: isProduct ? null : undefined,
    productId: isProduct ? null : undefined,
    description: "",
    name: "",
    quantity: "",
    unit: "",
    price: 0,
    costPrice: 0,
    taxRate: isProduct ? 13 : 0,
    taxId: isProduct ? "tax-13g-s" : null,
    discount: 0,
    image: "",
  };
}

/* ---------- 税项数据（演示，对齐 Odoo 中国税务） ---------- */

const TAX_SCOPE_GOODS = "货物及加工修理修配劳务";
const TAX_SCOPE_SERVICE = "服务、不动产和无形资产";

function makeTax(
  id: string,
  label: string,
  scope: string,
  desc: string,
  usage: number,
): SelectRecord {
  return {
    id,
    label,
    usage,
    details: [
      { label: "税范围", value: scope },
      { label: "描述", value: desc },
    ],
  };
}

export const TAXES: SelectRecord[] = [
  makeTax("tax-13g-s", "13% 货 专票", TAX_SCOPE_GOODS, "13%税率 - 货物 - 增值税专用发票", 95),
  makeTax("tax-13g-o", "13% 货 其他票", TAX_SCOPE_GOODS, "13%税率 - 货物 - 增值税其他发票", 88),
  makeTax("tax-13s-s", "13% 服 专票", TAX_SCOPE_SERVICE, "13%税率 - 服务、不动产和无形资产 - 增值税专用发票", 90),
  makeTax("tax-13s-o", "13% 服 其他票", TAX_SCOPE_SERVICE, "13%税率 - 服务、不动产和无形资产 - 增值税其他发票", 82),
  makeTax("tax-9g-s", "9% 货 专票", TAX_SCOPE_GOODS, "9%税率 - 货物及加工修理修配劳务 - 增值税专用发票", 60),
  makeTax("tax-9g-o", "9% 货 其他票", TAX_SCOPE_GOODS, "9%税率 - 货物及加工修理修配劳务 - 增值税其他发票", 55),
  makeTax("tax-9s-s", "9% 服 专票", TAX_SCOPE_SERVICE, "9%税率 - 服务、不动产和无形资产 - 增值税专用发票", 58),
  makeTax("tax-9s-o", "9% 服 其他票", TAX_SCOPE_SERVICE, "9%税率 - 服务、不动产和无形资产 - 增值税其他发票", 52),
  makeTax("tax-6s", "6% 专票", TAX_SCOPE_SERVICE, "6%税率 - 增值税专用发票", 70),
  makeTax("tax-6o", "6% 其他票", TAX_SCOPE_SERVICE, "6%税率 - 增值税其他发票", 64),
  makeTax("tax-5s-s", "5% 专票", TAX_SCOPE_SERVICE, "5%征收率 - 服务、不动产和无形资产 - 增值税专用发票", 40),
  makeTax("tax-5s-o", "5% 其他票", TAX_SCOPE_SERVICE, "5%征收率 - 服务、不动产和无形资产 - 增值税其他发票", 36),
  makeTax("tax-3g-s", "3% 货 专票", TAX_SCOPE_GOODS, "3%征收率 - 货物及加工修理修配劳务 - 增值税专用发票", 48),
  makeTax("tax-3g-o", "3% 货 其他票", TAX_SCOPE_GOODS, "3%征收率 - 货物及加工修理修配劳务 - 增值税其他发票", 44),
  makeTax("tax-3s-s", "3% 服 专票", TAX_SCOPE_SERVICE, "3%征收率 - 服务、不动产和无形资产 - 增值税专用发票", 42),
  makeTax("tax-3s-o", "3% 服 其他票", TAX_SCOPE_SERVICE, "3%征收率 - 服务、不动产和无形资产 - 增值税其他发票", 38),
  makeTax("tax-0mdt-g", "0% 免抵退 货 其他票", TAX_SCOPE_GOODS, "0% 免抵退 - 货物及加工修理修配劳务 - 增值税其他发票", 20),
  makeTax("tax-0mdt-s", "0% 免抵退 服 其他票", TAX_SCOPE_SERVICE, "0% 免抵退 - 服务、不动产和无形资产 - 增值税其他发票", 18),
  makeTax("tax-exg-s", "免税 货 专票", TAX_SCOPE_GOODS, "免税 - 货物及加工修理修配劳务 - 增值税专用发票", 24),
  makeTax("tax-exg-o", "免税 货 其他票", TAX_SCOPE_GOODS, "免税 - 货物及加工修理修配劳务 - 增值税其他发票", 22),
  makeTax("tax-exs-s", "免税 服 专票", TAX_SCOPE_SERVICE, "免税 - 服务、不动产和无形资产 - 增值税专用发票", 23),
  makeTax("tax-exs-o", "免税 服 其他票", TAX_SCOPE_SERVICE, "免税 - 服务、不动产和无形资产 - 增值税其他发票", 21),
  makeTax("tax-0mts-gs", "0% 免退税 货 专票", TAX_SCOPE_GOODS, "0% 免退税 - 货物及加工修理修配劳务 - 增值税专用发票", 16),
  makeTax("tax-0mts-go", "0% 免退税 货 其他票", TAX_SCOPE_GOODS, "0% 免退税 - 货物及加工修理修配劳务 - 增值税其他发票", 15),
  makeTax("tax-0mts-ss", "0% 免退税 服 专票", TAX_SCOPE_SERVICE, "0% 免退税 - 服务、不动产和无形资产 - 增值税专用发票", 14),
  makeTax("tax-0mts-so", "0% 免退税 服 其他票", TAX_SCOPE_SERVICE, "0% 免退税 - 服务、不动产和无形资产 - 增值税其他发票", 13),
  makeTax("tax-3r2", "3% 减按 2%", TAX_SCOPE_GOODS, "3% 征收率减按 2% - 货物 - 普票", 30),
  makeTax("tax-3r1", "3% 减按 1%", TAX_SCOPE_GOODS, "3% 征收率减按 1% - 货物 - 普票", 28),
  makeTax("tax-3r15", "3% 减按 1.5%", TAX_SCOPE_SERVICE, "3% 征收率减按 1.5% - 服务 - 普票", 26),
];

/** 从税项名称解析适用税率（%）：「13% 货 专票」→13；「3% 减按 2%」→2；免税/免抵退 → 0 */
function taxPercentOf(label: string): number {
  const nums = [...label.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => Number(m[1]));
  if (nums.length === 0) return 0;
  return label.includes("减按") ? (nums[nums.length - 1] ?? 0) : (nums[0] ?? 0);
}

function lineSubtotal(l: OrderLine) {
  return l.price * (l.quantity || 0) * (1 - (l.discount || 0));
}

/** 组合金额合计 = 子行小计之和 × 组合数量 */
function comboTotal(combo: OrderLine, lines: OrderLine[]) {
  const sum = lines
    .filter((l) => l.parentId === combo.id && l.type === "product")
    .reduce((acc, l) => acc + lineSubtotal(l), 0);
  return sum * (combo.quantity || 1);
}

function parsePrice(rec: SelectRecord) {
  const d = rec.details?.find((x) => /单价|price/i.test(x.label));
  return d ? parseFloat(d.value.replace(/[^\d.]/g, "")) || 0 : 0;
}

function parseCostPrice(rec: SelectRecord) {
  return rec.costPrice ?? 0;
}

function parseUnit(rec: SelectRecord) {
  return rec.sublabel?.split("·").pop()?.trim() ?? "";
}

/** 取得组合块在数组中的起止下标（组合 + 其连续子行） */
function blockOf(lines: OrderLine[], startIdx: number): [number, number] {
  const start = lines[startIdx];
  if (start.type !== "combo") return [startIdx, startIdx];
  let end = startIdx;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].parentId === start.id) end = i;
    else break;
  }
  return [startIdx, end];
}

/** 拖拽移动：reorder / 移入移出组合（单层嵌套） */
function moveLine(
  lines: OrderLine[],
  sourceId: string,
  targetId: string,
  position: DropPos,
): OrderLine[] {
  const srcIdx = lines.findIndex((l) => l.id === sourceId);
  if (srcIdx < 0) return lines;
  const src = lines[srcIdx];
  if (src.type === "combo" && position === "inside") return lines; // 组合不能放入组合

  const [bs, be] = src.type === "combo" ? blockOf(lines, srcIdx) : [srcIdx, srcIdx];
  const block = lines.slice(bs, be + 1).map((b) => ({ ...b }));
  if (block.some((b) => b.id === targetId)) return lines; // 不能拖入自身块内

  const rest = lines.filter((_, i) => i < bs || i > be);
  const tIdx = rest.findIndex((l) => l.id === targetId);
  if (tIdx < 0) return lines;
  const target = rest[tIdx];

  let insertAt: number;
  if (position === "inside" && target.type === "combo") {
    insertAt = tIdx + 1;
    for (let i = tIdx + 1; i < rest.length; i++) {
      if (rest[i].parentId === target.id) insertAt = i + 1;
      else break;
    }
    block.forEach((b) => {
      if (b.type === "product") b.parentId = target.id;
    });
  } else {
    const parentId = target.parentId ?? null;
    block.forEach((b) => {
      if (b.type === "product") b.parentId = parentId;
    });
    insertAt = position === "before" ? tIdx : tIdx + 1;
  }
  return [...rest.slice(0, insertAt), ...block, ...rest.slice(insertAt)];
}

/**
 * 复刻 Odoo 销售订单「订单明细」可编辑表格：
 * - 描述列内嵌产品选择器（选产品自动带出描述、可编辑），整表只有一个「描述」交互。
 * - 行类型：产品 / 组合(容器) / 备注；组合可填数量并自动汇总子行金额合计。
 * - 产品行可缩进/反缩进移入移出组合，亦支持拖拽排序与拖入组合。
 * - 组合行可折叠（隐藏子行，合计仍计入）；底部操作条：添加产品 / 添加组合 / 添加备注 / 在产品目录中选择。
 */
export function OrderLinesTable({
  products,
  lines: controlledLines,
  onLinesChange,
  currency = "¥",
  className,
  priceIncludeTax = false,
}: OrderLinesTableProps) {
  const { t } = useTranslation();
  const [internalLines, setInternalLines] = useState<OrderLine[]>(() => [
    makeRow("product"),
  ]);
  const isControlled = controlledLines != null;
  const lines = isControlled ? (controlledLines as OrderLine[]) : internalLines;
  const setLines: Dispatch<SetStateAction<OrderLine[]>> = (value) => {
    if (isControlled) {
      const next =
        typeof value === "function"
          ? (value as (prev: OrderLine[]) => OrderLine[])(controlledLines as OrderLine[])
          : value;
      onLinesChange?.(next);
    } else {
      setInternalLines(value);
    }
  };
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // 拖拽状态
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPos, setOverPos] = useState<DropPos | null>(null);

  const money = (n: number) =>
    `${currency}${n.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const patch = (id: string, p: Partial<OrderLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  const removeRow = (id: string) =>
    setLines((ls) => {
      const target = ls.find((l) => l.id === id);
      if (target?.type === "combo") {
        // 删除组合：子行提升为顶层，不删除产品
        const next = ls
          .filter((l) => l.id !== id)
          .map((l) => (l.parentId === id ? { ...l, parentId: null } : l));
        return next.length ? next : [makeRow("product")];
      }
      const next = ls.filter((l) => l.id !== id);
      return next.length ? next : [makeRow("product")];
    });

  // 末尾若存在完全空白的「产品」行则替换它，否则追加（仿 Odoo 的新行占位）
  const appendRow = (row: OrderLine) =>
    setLines((ls) => {
      const last = ls[ls.length - 1];
      const isBlank =
        last &&
        last.type === "product" &&
        !last.productId &&
        !last.description &&
        last.price === 0 &&
        last.quantity === "" &&
        !last.taxRate &&
        !last.discount;
      return isBlank ? [...ls.slice(0, -1), row] : [...ls, row];
    });

  const addRow = (type: OrderRowType) => appendRow(makeRow(type));

  const addFromCatalog = (p: SelectRecord) =>
    appendRow({
      ...makeRow("product"),
      productId: p.id,
      unit: parseUnit(p),
      price: parsePrice(p),
      costPrice: parseCostPrice(p),
    });

  // 折叠
  const toggleCollapse = (id: string) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  // 拖拽处理
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (e: React.DragEvent, row: OrderLine) => {
    if (!dragId || dragId === row.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientY - rect.top) / rect.height;
    let pos: DropPos;
    if (row.type === "combo") {
      pos = frac < 0.34 ? "before" : frac > 0.66 ? "after" : "inside";
    } else {
      pos = frac < 0.5 ? "before" : "after";
    }
    setOverId(row.id);
    setOverPos(pos);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragId && overId && dragId !== overId && overPos) {
      setLines((ls) => moveLine(ls, dragId, overId, overPos));
    }
    setDragId(null);
    setOverId(null);
    setOverPos(null);
  };
  const onDragEnd = () => {
    setDragId(null);
    setOverId(null);
    setOverPos(null);
  };

  const dropStyle = (id: string): React.CSSProperties | undefined => {
    if (overId !== id || !overPos) return undefined;
    if (overPos === "inside")
      return { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" };
    return {
      boxShadow: `inset 0 ${overPos === "before" ? "3px" : "-3px"} 0 0 var(--primary)`,
    };
  };

  // 合计：产品行小计 ×（若在组合内则乘组合数量），避免双重计算
  // taxIncludeTax: 单价含税时按税率倒算未税金额与税额；否则税额另计
  const { untaxed, tax, total, taxByRate, profit, margin } = useMemo(() => {
    const byId = new Map(lines.map((l) => [l.id, l]));
    let u = 0;
    let tx = 0;
    let cost = 0;
    const byRate = new Map<number, number>();
    for (const l of lines) {
      if (l.type !== "product") continue;
      const parent = l.parentId ? byId.get(l.parentId) : null;
      const mult = parent ? parent.quantity || 1 : 1;
      const sub = lineSubtotal(l) * mult;
      const rate = l.taxRate || 0;
      let lineUntaxed: number;
      let lineTax: number;
      if (priceIncludeTax) {
        lineUntaxed = sub / (1 + rate / 100);
        lineTax = sub - lineUntaxed;
      } else {
        lineUntaxed = sub;
        lineTax = sub * (rate / 100);
      }
      u += lineUntaxed;
      tx += lineTax;
      cost += (l.costPrice || 0) * (l.quantity || 0) * mult;
      if (rate > 0) byRate.set(rate, (byRate.get(rate) ?? 0) + lineTax);
    }
    const p = u - cost;
    const m = u > 0 ? (p / u) * 100 : 0;
    const taxByRate = Array.from(byRate.entries())
      .map(([rate, amount]) => ({ rate, amount }))
      .sort((a, b) => b.rate - a.rate);
    return { untaxed: u, tax: tx, total: u + tx, taxByRate, profit: p, margin: m };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, priceIncludeTax]);

  const catalogFiltered = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.sublabel?.toLowerCase().includes(q),
    );
  }, [catalogQuery, products]);

  // 折叠：计算可见行（隐藏被折叠组合的子行）
  const visibleLines: OrderLine[] = [];
  {
    let collapsedParent: string | null = null;
    for (const l of lines) {
      if (collapsedParent) {
        if (l.parentId === collapsedParent) continue;
        collapsedParent = null;
      }
      if (l.type === "combo" && collapsed[l.id]) collapsedParent = l.id;
      visibleLines.push(l);
    }
  }

  const headerCell = (
    label: string,
    align: "left" | "right" = "left",
    className?: string,
  ) => (
    <th
      className={cn(
        "whitespace-nowrap px-2 py-2 text-xs font-medium text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {label}
    </th>
  );

  const grip = () => (
    <GripVertical
      className="size-4 shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground"
      aria-hidden
      data-drag-handle
    />
  );

  // 上传产品需求图片：经后端 /upload 落盘，返回可访问 URL
  const uploadLineImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data.url as string;
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="max-h-[460px] overflow-auto">
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <thead>
            <tr className="sticky top-0 z-10 bg-muted">
              {/* 固定布局下唯一未设宽的列（描述）自动吸收剩余宽度；其余列按百分比自适应容器 */}
              {headerCell(t("orderLines.description"))}
              {/* 产品需求图片（每行独立上传） */}
              <th className="w-[6%] px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                {t("orderLines.image")}
              </th>
              {headerCell(t("orderLines.quantity"), "right", "w-[8%]")}
              {headerCell(t("orderLines.unitPrice"), "right", "w-[12%]")}
              {headerCell(t("orderLines.costPrice"), "right", "w-[12%]")}
              {headerCell(t("orderLines.taxes"), "left", "w-[16%]")}
              {headerCell(t("orderLines.subtotal"), "right", "w-[15%]")}
              <th className="w-[5%] px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {visibleLines.map((l) => {
              const dragging = dragId === l.id;
              if (l.type === "combo") {
                const open = !collapsed[l.id];
                const childCount = lines.filter(
                  (x) => x.parentId === l.id,
                ).length;
                return (
                  <tr
                    key={l.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, l.id)}
                    onDragOver={(e) => onDragOver(e, l)}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    style={dropStyle(l.id)}
                    className={cn(
                      "group border-b border-border/60 bg-muted/30",
                      dragging && "opacity-40",
                    )}
                  >
                    <td className="p-1 align-middle">
                      <div className="flex items-center gap-1.5">
                        {grip()}
                        <button
                          type="button"
                          aria-label={open ? "折叠" : "展开"}
                          onClick={() => toggleCollapse(l.id)}
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          {open ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </button>
                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {t("orderLines.addCombo").replace(/^添加/, "")}
                        </span>
                        <Input
                          value={l.name}
                          placeholder={t("orderLines.comboPlaceholder")}
                          className="h-8 flex-1 rounded-md border-0 bg-transparent px-2 font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                          onChange={(e) => patch(l.id, { name: e.target.value })}
                        />
                        {!open && childCount > 0 && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            ({childCount})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="w-[6%] p-1 align-middle" />
                    <td className="w-[8%] p-1 align-middle">
                      <InputNumber
                        value={l.quantity}
                        onChange={(v) => patch(l.id, { quantity: v })}
                        step={1}
                        bare
                      />
                    </td>
                    <td colSpan={4} className="p-1" />
                    <td className="w-[15%] truncate px-2 py-1.5 text-right align-middle text-sm font-semibold tabular-nums">
                      {money(comboTotal(l, lines))}
                    </td>
                    <td className="p-1 align-middle">
                      <button
                        type="button"
                        aria-label={t("orderLines.remove")}
                        onClick={() => removeRow(l.id)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              }
              if (l.type === "note") {
                return (
                  <tr
                    key={l.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, l.id)}
                    onDragOver={(e) => onDragOver(e, l)}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    style={dropStyle(l.id)}
                    className={cn(
                      "group border-b border-border/60 hover:bg-muted/30",
                      dragging && "opacity-40",
                    )}
                  >
                    <td colSpan={8} className="p-1">
                      <div className="flex items-center gap-1.5">
                        {grip()}
                        <Input
                          value={l.name}
                          placeholder={t("orderLines.notePlaceholder")}
                          className="h-8 w-full flex-1 rounded-md border-0 bg-transparent px-2 text-muted-foreground italic shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                          onChange={(e) => patch(l.id, { name: e.target.value })}
                        />
                      </div>
                    </td>
                    <td className="p-1 align-middle">
                      <button
                        type="button"
                        aria-label={t("orderLines.remove")}
                        onClick={() => removeRow(l.id)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              }
              // 产品行
              return (
                <tr
                  key={l.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, l.id)}
                  onDragOver={(e) => onDragOver(e, l)}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  style={dropStyle(l.id)}
                  className={cn(
                    "group border-b border-border/60 hover:bg-muted/30",
                    dragging && "opacity-40",
                  )}
                >
                  <td
                    className={cn(
                      "p-1 align-middle",
                      l.parentId && "border-l-2 border-border/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 items-center gap-1",
                        l.parentId && "ml-3",
                      )}
                    >
                      {grip()}
                      <div className="min-w-0 flex-1">
                        <Picker
                          records={products}
                          value={l.productId}
                          topN={5}
                          bare
                          className="w-full"
                          searchMoreTitle={t("orderLines.product")}
                          placeholder={t("orderLines.searchProduct")}
                          fallbackText={l.description || undefined}
                          onChange={(rec) =>
                            patch(l.id, {
                              productId: rec?.id ?? null,
                              description: rec ? rec.label : "",
                              unit: rec ? parseUnit(rec) : "",
                              costPrice: rec ? parseCostPrice(rec) : 0,
                            })
                          }
                          onInputChange={(text) =>
                            patch(l.id, {
                              description: text,
                              productId: text.trim() ? l.productId : null,
                            })
                          }
                        />
                      </div>
                    </div>
                  </td>
                  <td className="w-[6%] p-1 align-middle">
                    <ImageUpload
                      value={l.image || null}
                      onChange={(v) => patch(l.id, { image: v ?? "" })}
                      onUpload={uploadLineImage}
                      ratio="1/1"
                      className="w-10"
                      hideHint
                      compact
                    />
                  </td>
                  <td className="w-16 p-1 align-middle">
                    <InputNumber
                      value={l.quantity}
                      onChange={(v) => patch(l.id, { quantity: v })}
                      step={1}
                      bare
                    />
                  </td>
                  <td className="w-[12%] p-1 align-middle">
                    <InputNumber
                      value={l.price}
                      onChange={(v) => patch(l.id, { price: v === "" ? 0 : v })}
                      min={0}
                      bare
                    />
                  </td>
                  <td className="w-[12%] p-1 align-middle">
                    <InputNumber
                      value={l.costPrice ?? 0}
                      onChange={(v) => patch(l.id, { costPrice: v === "" ? 0 : v })}
                      min={0}
                      bare
                    />
                  </td>
                  <td className="w-[16%] p-1 align-middle">
                    <Picker
                      records={TAXES}
                      value={l.taxId}
                      topN={5}
                      className="w-full"
                      searchMoreTitle={t("orderLines.taxes")}
                      placeholder={t("orderLines.taxPlaceholder")}
                      fallbackText={l.taxRate > 0 ? `${l.taxRate}%` : undefined}
                      bare
                      onChange={(rec) =>
                        patch(l.id, {
                          taxId: rec?.id ?? null,
                          taxRate: rec ? taxPercentOf(rec.label) : 0,
                        })
                      }
                    />
                  </td>
                  <td className="w-[15%] truncate px-2 py-1.5 text-right align-middle text-sm font-medium tabular-nums">
                    {money(lineSubtotal(l))}
                  </td>
                  <td className="p-1 align-middle">
                    <button
                      type="button"
                      aria-label={t("orderLines.remove")}
                      onClick={() => removeRow(l.id)}
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={8} className="p-0">
                <div className="flex flex-wrap items-center gap-1 border-t border-dashed border-border px-2 py-1.5">
                  <ButtonVariantGhost
                    onClick={() => addRow("product")}
                    icon={<Plus />}
                    label={t("orderLines.addProduct")}
                  />
                  <ButtonVariantGhost
                    onClick={() => addRow("combo")}
                    icon={<Layers />}
                    label={t("orderLines.addCombo")}
                  />
                  <ButtonVariantGhost
                    onClick={() => addRow("note")}
                    icon={<StickyNote />}
                    label={t("orderLines.addNote")}
                  />
                  <ButtonVariantGhost
                    onClick={() => {
                      setCatalogQuery("");
                      setCatalogOpen(true);
                    }}
                    icon={<Store />}
                    label={t("orderLines.fromCatalog")}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end border-t border-border">
        <div className="w-full max-w-xs p-3 text-sm">
          <div className="flex justify-between py-0.5 text-muted-foreground">
            <span>{t("orderLines.untaxed")}</span>
            <span className="tabular-nums">{money(untaxed)}</span>
          </div>
          {/* 按税率分组的税额统计 */}
          {taxByRate.map(({ rate, amount }) => (
            <div
              key={rate}
              className="flex justify-between py-0.5 text-muted-foreground"
            >
              <span>
                {t("orderLines.taxByRate", { rate })}
              </span>
              <span className="tabular-nums">{money(amount)}</span>
            </div>
          ))}
          {taxByRate.length > 1 && (
            <div className="flex justify-between py-0.5 text-muted-foreground">
              <span>{t("orderLines.tax")}</span>
              <span className="tabular-nums">{money(tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border py-1 font-semibold text-foreground">
            <span>{t("orderLines.total")}</span>
            <span className="tabular-nums">{money(total)}</span>
          </div>
          <div
            className={cn(
              "flex justify-between border-t border-border py-1 font-semibold",
              profit >= 0 ? "text-emerald-600" : "text-red-600",
            )}
          >
            <span>
              {t("orderLines.profit")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({margin.toFixed(1)}%)
              </span>
            </span>
            <span className="tabular-nums">{money(profit)}</span>
          </div>
        </div>
      </div>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>{t("orderLines.catalogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={catalogQuery}
                placeholder={t("orderLines.searchProduct")}
                className="pl-8"
                onChange={(e) => setCatalogQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            {catalogFiltered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("orderLines.catalogEmpty")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {catalogFiltered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addFromCatalog(p)}
                    className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
                  >
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.label}
                        ratio="1/1"
                        className="size-12 shrink-0 rounded-md"
                      />
                    ) : (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                        {p.avatarText ?? p.label.slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {p.label}
                      </span>
                      {p.sublabel && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.sublabel}
                        </span>
                      )}
                      <span className="mt-0.5 block text-sm font-medium tabular-nums">
                        {parsePrice(p) > 0 ? money(parsePrice(p)) : "—"}
                      </span>
                    </span>
                    <Plus className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 底部操作条按钮（ghost 小按钮，带图标 + 文案）
function ButtonVariantGhost({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      <span className="flex size-4 items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

interface OrderLinesTableProps {
  products: SelectRecord[];
  /** 受控模式：传入则用该值，并通过 onLinesChange 回流变更；不传则为内部自管理 */
  lines?: OrderLine[];
  onLinesChange?: (lines: OrderLine[]) => void;
  currency?: string;
  className?: string;
  /** 价格是否含税：true=单价含税（倒算税额），false=单价不含税（税额另计），默认 false */
  priceIncludeTax?: boolean;
}
