/**
 * 报价单模板「系统字段」注册表 + 样例数据 + 金额派生。
 * 这是调色板与渲染解析的唯一真相源：拖进编辑器的占位符 key 都来自这里。
 */

export type FieldKind = "text" | "date" | "number";
export type FieldFormat = "currency" | "int" | "percent";
export type FieldGroup = "customer" | "quotation" | "totals" | "line";

export interface FieldDef {
  /** 点路径，如 "customer.name" / "line.name"（line.* 仅在循环表内有效） */
  key: string;
  label: string;
  group: FieldGroup;
  kind: FieldKind;
  format?: FieldFormat;
  /** 仅可在循环表（lines）内使用 */
  loopScope?: "line";
}

export interface LineItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  taxRate: number;
  amount: number;
  tax: number;
}

export interface TemplateData {
  customer: {
    name: string;
    company: string;
    country: string;
    email: string;
    phone: string;
    website: string;
    customerType: string;
  } | null;
  quotation: {
    number: string;
    date: string;
    validUntil: string;
    deliveryDate: string;
    paymentTerms: string;
    tradeTerms: string;
    shippingAddress: string;
    notes: string;
    priceIncludeTax: boolean;
  };
  totals: { amount: number; tax: number; totalWithTax: number };
  lines: LineItem[];
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** 由明细行派生 合计/税额/价税合计（客户端，对应后端 deriveAmount 的扩展）。 */
export function computeTotals(
  lines: Omit<LineItem, "amount" | "tax">[],
  priceIncludeTax: boolean,
): { lines: LineItem[]; totals: TemplateData["totals"] } {
  let amount = 0;
  let tax = 0;
  const out: LineItem[] = lines.map((l) => {
    const qty = typeof l.quantity === "number" ? l.quantity : 0;
    const gross = l.price * qty * (1 - (l.discount || 0) / 100);
    let lineTax: number;
    if (priceIncludeTax) {
      lineTax = gross - gross / (1 + (l.taxRate || 0) / 100);
    } else {
      lineTax = gross * (l.taxRate || 0) / 100;
    }
    amount += gross;
    tax += lineTax;
    return { ...l, amount: round2(gross), tax: round2(lineTax) };
  });
  return {
    lines: out,
    totals: {
      amount: round2(amount),
      tax: round2(tax),
      totalWithTax: round2(amount + tax),
    },
  };
}

/** 系统字段清单（调色板分组） */
export const FIELD_DEFS: FieldDef[] = [
  // 客户
  { key: "customer.name", label: "客户名称", group: "customer", kind: "text" },
  { key: "customer.company", label: "客户公司", group: "customer", kind: "text" },
  { key: "customer.country", label: "客户国家/地区", group: "customer", kind: "text" },
  { key: "customer.email", label: "客户邮箱", group: "customer", kind: "text" },
  { key: "customer.phone", label: "客户电话", group: "customer", kind: "text" },
  { key: "customer.website", label: "客户官网", group: "customer", kind: "text" },
  { key: "customer.customerType", label: "客户类型", group: "customer", kind: "text" },
  // 报价单
  { key: "quotation.number", label: "报价单号", group: "quotation", kind: "text" },
  { key: "quotation.date", label: "报价日期", group: "quotation", kind: "date" },
  { key: "quotation.validUntil", label: "有效期至", group: "quotation", kind: "date" },
  { key: "quotation.deliveryDate", label: "交付日期", group: "quotation", kind: "date" },
  { key: "quotation.paymentTerms", label: "付款条款", group: "quotation", kind: "text" },
  { key: "quotation.tradeTerms", label: "贸易条款", group: "quotation", kind: "text" },
  { key: "quotation.shippingAddress", label: "收货地址", group: "quotation", kind: "text" },
  { key: "quotation.notes", label: "备注", group: "quotation", kind: "text" },
  // 金额
  { key: "totals.amount", label: "合计(未税)", group: "totals", kind: "number", format: "currency" },
  { key: "totals.tax", label: "税额", group: "totals", kind: "number", format: "currency" },
  { key: "totals.totalWithTax", label: "价税合计", group: "totals", kind: "number", format: "currency" },
  // 明细（循环表内）
  { key: "line.name", label: "产品名称", group: "line", kind: "text", loopScope: "line" },
  { key: "line.description", label: "产品描述", group: "line", kind: "text", loopScope: "line" },
  { key: "line.quantity", label: "数量", group: "line", kind: "number", format: "int", loopScope: "line" },
  { key: "line.unit", label: "单位", group: "line", kind: "text", loopScope: "line" },
  { key: "line.price", label: "单价", group: "line", kind: "number", format: "currency", loopScope: "line" },
  { key: "line.discount", label: "折扣(%)", group: "line", kind: "number", format: "percent", loopScope: "line" },
  { key: "line.taxRate", label: "税率(%)", group: "line", kind: "number", format: "percent", loopScope: "line" },
  { key: "line.amount", label: "行金额", group: "line", kind: "number", format: "currency", loopScope: "line" },
  { key: "line.tax", label: "行税额", group: "line", kind: "number", format: "currency", loopScope: "line" },
];

export const FIELD_GROUPS: { id: FieldGroup; label: string }[] = [
  { id: "customer", label: "客户" },
  { id: "quotation", label: "报价单" },
  { id: "totals", label: "金额" },
  { id: "line", label: "明细行（循环表内）" },
];

const currencyFmt = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
});

/** 按字段定义格式化取值 */
export function formatField(def: FieldDef, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (def.kind === "number" && typeof value === "number") {
    if (def.format === "currency") return currencyFmt.format(value);
    if (def.format === "int") return String(Math.round(value));
    if (def.format === "percent") return `${value}%`;
    return String(value);
  }
  if (def.kind === "date" && typeof value === "string") {
    return value.slice(0, 10);
  }
  return String(value);
}

/** 按 key 从数据中取值（支持 "a.b.c" 点路径；line.* 在循环表内从 loopItem 取） */
export function resolveKey(data: TemplateData, key: string, loopItem?: LineItem): unknown {
  const target = key.startsWith("line.") ? loopItem : data;
  if (!target) return "";
  const path = key.startsWith("line.") ? key.slice("line.".length) : key;
  const value = path.split(".").reduce<unknown>((acc, seg) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[seg];
    return undefined;
  }, target);
  return value ?? "";
}

/** 默认样例数据（演示用；生产环境由真实报价单填充，公司信息由用户在模板里手动输入） */
export function sampleTemplateData(): TemplateData {
  const raw = [
    { name: "无线蓝牙耳机", description: "ANC 主动降噪 / 30h 续航", quantity: 200, unit: "台", price: 89, discount: 5, taxRate: 13 },
    { name: "Type-C 充电线", description: "1m / 100W", quantity: 500, unit: "条", price: 12, discount: 0, taxRate: 13 },
    { name: "收纳硬盒", description: "定制 Logo", quantity: 200, unit: "个", price: 6.5, discount: 10, taxRate: 13 },
  ];
  const { lines, totals } = computeTotals(raw, false);
  return {
    customer: {
      name: "Acme Trading Ltd.",
      company: "Acme Group",
      country: "United States",
      email: "purchase@acme.example",
      phone: "+1 212 555 0100",
      website: "https://acme.example",
      customerType: "贸易商",
    },
    quotation: {
      number: "S00042",
      date: "2026-11-04",
      validUntil: "2026-11-18",
      deliveryDate: "2026-12-05",
      paymentTerms: "30% 预付款，70% 发货前付清",
      tradeTerms: "FOB 深圳",
      shippingAddress: "Los Angeles, CA, USA",
      notes: "本报价含 13% 增值税专用票，最终以双方盖章合同为准。",
      priceIncludeTax: false,
    },
    totals,
    lines,
  };
}
