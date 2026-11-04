import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PenLine,
  PenTool,
  FlaskConical,
  FileSignature,
  Receipt,
  PackageCheck,
  Truck,
  Repeat,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { PageMeta } from "@/components/layout/PageMeta";
import { HeaderCenter } from "@/components/layout/AppShell";
import { StageStepper, type StageOption } from "@/components/crm/StageStepper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PillToggle } from "@/components/common/PillToggle";
import { SalespersonPicker, type SalesPerson } from "@/components/common/SalespersonPicker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Chatter, type ChatterMessage } from "@/components/chatter/Chatter";
import type { ContactValues } from "@/components/crm/ContactForm";
import { EMPTY_CONTACT, isContactComplete } from "@/components/crm/ContactForm";
import type { ProductValues } from "@/components/crm/ProductForm";
import { OrderLinesTable, TAXES, uid, type OrderLine } from "@/components/crm/OrderLinesTable";
import { Picker } from "@/components/common/Picker";
import type { SelectRecord } from "@/components/common/SearchableSelect";

interface DealDetailData {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  assignee: string | null;
  meta: string | null;
  source: string | null;
  stage: { id: string; title: string; accent: string; key?: string };
  stageLogs?: {
    stageId: string;
    stageKey: string;
    stageTitle: string;
    enteredAt: string;
    leftAt: string | null;
  }[];
  contact: (ContactValues & { id: string }) | null;
  product: (ProductValues & { id: string }) | null;
  /** 订单明细（整张表 JSON，含组合/备注/排序；行级数量与折扣随行）。后端字段名为 linesJson。 */
  linesJson?: string | null;
  /** 价格是否含税：true=单价含税（倒算税额），false=单价不含税（税额另计）。 */
  priceIncludeTax?: boolean;
}

/** 产物栏：固定单据类型，按固定阶段解锁（minStage = 阶段有序下标，到达该阶段才出现），数量先占位 0。 */
const DELIVERABLES = [
  { key: "quote", icon: PenLine, minStage: 2 },
  { key: "design", icon: PenTool, minStage: 2 },
  { key: "sampleOrder", icon: FlaskConical, minStage: 3 },
  { key: "contract", icon: FileSignature, minStage: 4 },
  { key: "remittance", icon: Receipt, minStage: 4 },
  { key: "production", icon: PackageCheck, minStage: 5 },
  { key: "logistics", icon: Truck, minStage: 6 },
];

/** 将停留毫秒数格式化为紧凑中文：12天 / 5小时 / 30分钟 / 45秒 / 刚刚。 */
function formatDwell(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return totalSeconds <= 5 ? "刚刚" : `${totalSeconds}秒`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  if (days > 0) return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
  if (hours > 0) return `${hours}小时`;
  return `${totalMinutes}分钟`;
}

function formatMoney(n: number) {
  return `¥${n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// 演示用商机来源（Picker 下拉用，id 与 label 一致，便于按 label 存取）
// 注意：选项须与 MCP 实际写入的来源值对齐（国际站寿春店=espdzi、国际站微它店=weitapet、Accio=无店铺时的默认来源），
// 否则 Picker 匹配不到会空白；picker 另设 fallbackText 兜底任何未在列表中的存量值。
const DEAL_SOURCE_RECORDS: SelectRecord[] = [
  "国际站寿春店",
  "国际站微它店",
  "1688景元店",
  "展会",
  "转介绍",
  "Accio",
  "社媒",
].map((s) => ({ id: s, label: s }));

// 客户类型：纯业务分类（终端客户/贸易商/工厂 等的归类）。
// 注意：「待完善」不是客户类型，它是系统对「由 Accio AI 生成、信息不保真」客户打的“信息待核实”标记（见 contact.aiGenerated），
// 单独以徽标展示，绝不混入本下拉选项。
const DEAL_CUSTOMER_TYPE_RECORDS: SelectRecord[] = [
  "跨境电商类型",
  "传统商超类型",
  "品牌 & 代工类型",
  "教育文旅类型",
  "渠道分销 & 代理类",
  "政企 & 单位采购类",
  "传统贸易类型",
].map((s) => ({ id: s, label: s }));

// 演示用国家/地区（Picker 下拉用，id 与 label 一致）
const DEAL_COUNTRY_RECORDS: SelectRecord[] = [
  "中国",
  "中国香港",
  "中国台湾",
  "美国",
  "加拿大",
  "墨西哥",
  "巴西",
  "德国",
  "英国",
  "法国",
  "意大利",
  "西班牙",
  "荷兰",
  "波兰",
  "俄罗斯",
  "土耳其",
  "日本",
  "韩国",
  "印度",
  "越南",
  "泰国",
  "马来西亚",
  "印度尼西亚",
  "新加坡",
  "菲律宾",
  "阿联酋",
  "沙特阿拉伯",
  "澳大利亚",
  "南非",
  "埃及",
].map((s) => ({ id: s, label: s }));

// 演示用产品目录（订单明细的产品选择器用，detail 含单价/单位供带入）
const DEAL_PRODUCTS: SelectRecord[] = [
  { id: "p1", label: "无线蓝牙耳机 Pro", sublabel: "电子 · 台", avatarText: "耳", usage: 56, details: [{ label: "品类", value: "消费电子" }, { label: "单价", value: "¥299.00" }, { label: "单位", value: "台" }] },
  { id: "p2", label: "USB-C 快充适配器", sublabel: "电子 · 个", avatarText: "充", usage: 48, details: [{ label: "品类", value: "配件" }, { label: "单价", value: "¥89.00" }, { label: "单位", value: "个" }] },
  { id: "p3", label: "铝合金笔记本支架", sublabel: "五金 · 件", avatarText: "支", usage: 40, details: [{ label: "品类", value: "办公" }, { label: "单价", value: "¥129.00" }, { label: "单位", value: "件" }] },
  { id: "p4", label: "硅胶手机壳", sublabel: "塑胶 · 个", avatarText: "壳", usage: 33, details: [{ label: "品类", value: "配件" }, { label: "单价", value: "¥39.00" }, { label: "单位", value: "个" }] },
  { id: "p5", label: "便携投影仪 Mini", sublabel: "电子 · 台", avatarText: "投", usage: 28, details: [{ label: "品类", value: "消费电子" }, { label: "单价", value: "¥899.00" }, { label: "单位", value: "台" }] },
  { id: "p6", label: "收纳整理箱", sublabel: "家居 · 个", avatarText: "收", usage: 22, details: [{ label: "品类", value: "家居" }, { label: "单价", value: "¥59.00" }, { label: "单位", value: "个" }] },
];

// 演示用业务员（负责人）候选；当前登录用户会作为首项插入
const MOCK_SALESPEOPLE: SalesPerson[] = [
  { id: "s2", name: "李娜" },
  { id: "s3", name: "王强" },
  { id: "s4", name: "张敏" },
  { id: "s5", name: "陈晨" },
];

const nid = () => Math.random().toString(36).slice(2);

function emptyLine(): OrderLine {
  return {
    id: nid(),
    type: "product",
    parentId: null,
    productId: null,
    description: "",
    name: "",
    quantity: "",
    unit: "",
    price: 0,
    costPrice: 0,
    // 默认税项：13% 货 专票（与 OrderLinesTable 的 TAXES 中该记录 id 一致）
    taxId: "tax-13g-s",
    taxRate: 13,
    discount: 0,
    sourceProductUrl: "",
    sourceProductId: "",
  };
}

// 历史单产品接口 → 明细行（多出的 mode/process/audience/category/costPrice 字段在本组件弃用）
function productToLine(p: ProductValues): OrderLine {
  const taxRate = Number(p.tax) || 0;
  return {
    id: nid(),
    type: "product",
    parentId: null,
    productId: null,
    description: p.description ?? "",
    name: "",
    quantity: Number(p.quantity) > 0 ? Number(p.quantity) : 1,
    unit: p.unit ?? "",
    price: Number(p.price) || 0,
    costPrice: 0,
    taxRate,
    // 按税率回填一个默认税项（如 13% → 13% 货 专票）；无法区分货/服、专票/其他票时取首个
    taxId: TAXES.find((t) => t.label.startsWith(`${taxRate}%`))?.id ?? null,
    discount: 0,
  };
}

// 恢复 linesJson 时规范化行数据：旧数据/MCP 建单可能缺 quantity/price 等键，
// 直接透传会让 InputNumber 显示 "undefined"、合计算出 ¥NaN —— 统一补齐默认值。
// 另一关键：MCP 建单的行不带 id（服务端 toDealLines 未生成），而拖拽/行内编辑都按 id 定位行；
// 缺 id 时拖拽 onDragStart 收到 undefined，onDragOver 直接 return，行无法成为放置目标 → 拖不动。
// 故此处为缺失 id 的行补一个稳定 id（保存到库后即持久，后续加载不再重复生成）。
function normalizeRestoredLine(l: OrderLine): OrderLine {
  return {
    ...l,
    id: typeof l.id === "string" && l.id ? l.id : uid(),
    quantity: typeof l.quantity === "number" && Number.isFinite(l.quantity) && l.quantity > 0 ? l.quantity : "",
    unit: typeof l.unit === "string" ? l.unit : "",
    price: typeof l.price === "number" && Number.isFinite(l.price) ? l.price : 0,
    costPrice: typeof l.costPrice === "number" && Number.isFinite(l.costPrice) ? l.costPrice : 0,
    taxRate: typeof l.taxRate === "number" && Number.isFinite(l.taxRate) ? l.taxRate : 0,
    discount: typeof l.discount === "number" && Number.isFinite(l.discount) ? l.discount : 0,
  };
}

// 把 class-validator 默认英文报错翻译为中文可读文案（保留字段路径，如 contact.email）
function normalizeValidationMsg(m: string): string {
  return m
    .replace(/^each value in /i, "")
    .replace(/ should not be empty$/i, " 不能为空")
    .replace(/ should not be null or undefined$/i, " 不能为空")
    .replace(/ must be an email.*$/i, " 必须是邮箱格式")
    .replace(/ must be a string.*$/i, " 必须是文本")
    .replace(/ must be a number.*$/i, " 必须是数字")
    .replace(/ must be a boolean.*$/i, " 必须是布尔值")
    .replace(/ must be a valid date.*$/i, " 必须是有效日期")
    .replace(/ must be one of the following values.*$/i, " 取值不合法")
    .replace(/ must be an enum value.*$/i, " 取值不合法")
    .replace(/ is not allowed$/i, " 不允许填写");
}

// 从请求异常中提取可读的错误详情（优先字段级校验信息，精确到字段）
function extractErrorDetail(e: unknown): string {
  const err = e as { response?: { status?: number; data?: any }; code?: string; message?: string };
  // 无 response：请求根本没到应用层（网络断开 / 后端未启动 / 代理连不上）
  if (!err?.response) {
    if (err?.code === "ERR_NETWORK" || err?.code === "ECONNABORTED") {
      return "无法连接服务器，请确认后端已启动后重试";
    }
    return "网络异常，请稍后重试";
  }
  const status = err.response.status ?? 0;
  if (status === 401) return "登录已失效，请重新登录后再试";
  if (status === 403) return "没有权限执行此操作";
  if (status >= 500) return "服务器内部错误，请稍后重试";
  const data = err.response.data;
  const msg = data?.message;
  if (Array.isArray(msg) && msg.length) {
    return msg.map((m: unknown) => (typeof m === "string" ? normalizeValidationMsg(m) : String(m))).join("；");
  }
  if (typeof msg === "string" && msg) return normalizeValidationMsg(msg);
  if (typeof data?.error === "string" && data?.error) return data.error;
  return "保存失败，请检查表单后重试";
}
function linesTotal(ls: OrderLine[]) {
  const byId = new Map(ls.map((l) => [l.id, l]));
  let total = 0;
  for (const l of ls) {
    if (l.type !== "product") continue;
    const parent = l.parentId ? byId.get(l.parentId) : null;
    const mult = parent ? parent.quantity || 1 : 1;
    total += l.price * (l.quantity || 0) * (1 - (l.discount || 0)) * mult;
  }
  return total;
}

export default function DealForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isEdit = !!id && id !== "new";

  const [detail, setDetail] = useState<DealDetailData | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(false);

  // 阶段列表：新建默认落第一个阶段；详情页顶栏阶段条亦使用
  const [stages, setStages] = useState<StageOption[]>([]);

  // 表单状态
  const [assignee, setAssignee] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState<ContactValues>(EMPTY_CONTACT);
  const [contactId, setContactId] = useState<string | null>(null);
  // 真实联系人库（往来单位/联系人，扁平模型）下拉数据
  const [contacts, setContacts] = useState<SelectRecord[]>([]);
  // 公司列表（isCompany=true 的往来单位），供「所属公司」Picker 选用
  const [companyRecords, setCompanyRecords] = useState<SelectRecord[]>([]);
  const [lines, setLines] = useState<OrderLine[]>(() => [emptyLine()]);
  // Chatter 操作/讨论记录（由系统机器人 ominXBot 写入操作历史 + 人工评论）
  const [initialChatter, setInitialChatter] = useState<ChatterMessage[] | null>(null);
  const [chatterHasMore, setChatterHasMore] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // 真实产品目录（来自后端，含已上传的产品主图）；与演示目录合并，使上传产品图在明细中可见
  const [apiProducts, setApiProducts] = useState<SelectRecord[]>([]);
  useEffect(() => {
    api
      .get<
        Array<{
          id: string;
          description: string | null;
          image?: string | null;
          unit?: string | null;
          isRequirement?: boolean;
          costPrice?: number | null;
        }>
      >("/products")
      .then((r) =>
        setApiProducts(
          r.data.map((p) => ({
            id: p.id,
            label: p.description ?? "",
            image: p.image ?? undefined,
            // 带上单位，使从接口选择真实产品时单位能带入明细行
            sublabel: p.unit ? p.unit : undefined,
            isRequirement: p.isRequirement ?? false,
            costPrice: p.costPrice ?? undefined,
          })),
        ),
      )
      .catch(() => {});
  }, []);
  const products = useMemo<SelectRecord[]>(
    () => [...apiProducts, ...DEAL_PRODUCTS],
    [apiProducts],
  );
  // 价格含税方式：true=含税（默认），false=不含税
  const [priceIncludeTax, setPriceIncludeTax] = useState(true);
  // 产品需求 / 备注 Tab 当前项（控制含税/不含税胶囊仅在「产品需求」显示）
  const [productTab, setProductTab] = useState("product");
  // 业务员（负责人）：默认当前登录用户，同时承担创建人 + 负责人
  const [salespersonId, setSalespersonId] = useState("");

  // 可选业务员 = 当前用户（首项）+ 演示候选
  const users = useMemo<SalesPerson[]>(
    () =>
      user
        ? [{ id: user.id, name: user.name, email: user.email }, ...MOCK_SALESPEOPLE]
        : MOCK_SALESPEOPLE,
    [user],
  );

  // 负责人下拉数据由 SalespersonPicker 直接消费 users（头像 + 名称 + 点击下拉 + 浮层内搜索）

  // 创建人 = 当前选中的负责人（两者统一）；自动计入关注人。
  const creatorName = users.find((u) => u.id === salespersonId)?.name;

  // 新建时默认负责人为当前用户
  useEffect(() => {
    if (user && !salespersonId) {
      setSalespersonId(user.id);
      setAssignee(user.name);
    }
  }, [user, salespersonId]);

  const handleSalespersonChange = (id: string) => {
    setSalespersonId(id);
    setAssignee(users.find((u) => u.id === id)?.name ?? "");
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // 阶段流转（确认需求）进行中
  const [moving, setMoving] = useState(false);

  // 推进到下一阶段：取当前阶段在有序阶段列表中的下一项
  const handleAdvanceStage = async () => {
    if (!isEdit || !id) return;
    const idx = currentStageIndex;
    if (idx < 0) return;
    const next = stages[idx + 1];
    if (!next) return;
    // 推进到「报价」阶段：同步生成报价单（产物），并跳转到报价单详情。
    // 阶段推进由后端在建单时一并完成（未到报价阶段才推进，不会回退）。
    if (next.key === "quote") {
      setMoving(true);
      try {
        // 先保存商机当前状态（含税/明细等），确保新建报价单继承的是最新值
        await api.patch(`/crm/deals/${id}`, buildPayload());
        const r = await api.post<{ id: string; number: string }>("/quotations", {
          dealId: id,
        });
        toast.success(t("quotation.created", { number: r.data.number }));
        navigate(`/quotations/${r.data.id}`);
      } catch (e) {
        console.error("[DealForm] create quotation failed:", e);
        toast.error(extractErrorDetail(e));
      } finally {
        setMoving(false);
      }
      return;
    }
    setMoving(true);
    try {
      await api.patch(`/crm/deals/${id}`, { stageId: next.id });
      const r = await api.get<DealDetailData>(`/crm/deals/${id}`);
      setDetail(r.data);
      setRefreshToken((k) => k + 1); // 增量刷新讨论区，显示推进相关的系统记录
      toast.success(t("crm.stageAdvanced"));
    } catch (e) {
      console.error("[DealForm] advance stage failed:", e);
      toast.error(extractErrorDetail(e));
    } finally {
      setMoving(false);
    }
  };

  // 拉取阶段列表（按 position 有序）
  useEffect(() => {
    api
      .get<StageOption[]>("/crm/board")
      .then((r) =>
        setStages(r.data.map(({ id, title, accent, key }) => ({ id, title, accent, key }))),
      )
      .catch(() => setStages([]));
    // 加载往来单位（顶层公司）下拉数据
    // eslint-disable-next-line react-hooks/exhaustive-deps
    void loadContacts();
    void loadCompanies();
  }, []);

  // 当前商机的报价单数量（产物栏「报价」计数）；推进/保存后随 refreshToken 刷新
  const [quoteCount, setQuoteCount] = useState(0);
  // 往来单位（顶层公司）/ 联系人（公司下人员）实时拉取与创建
  const mapContact = (c: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    country?: string | null;
    isCompany?: boolean | null;
  }): SelectRecord => ({
    id: c.id,
    label: c.name ?? "",
    sublabel: c.email || c.phone || c.company || "",
    isCompany: c.isCompany ?? false,
    details: [
      { label: t("contact.email"), value: c.email || "" },
      { label: t("contact.phone"), value: c.phone || "" },
      { label: t("contact.country"), value: c.country || "" },
    ].filter((d) => d.value),
  });

  // 往来单位 / 联系人（扁平联系人库）：全量拉取，下拉选 + 可创建
  const loadContacts = async () => {
    const r = await api.get<any[]>("/contacts?limit=300");
    setContacts(r.data.map(mapContact));
  };

  // 公司列表（isCompany=true）：供「所属公司」Picker 选用
  const loadCompanies = async () => {
    const r = await api.get<any[]>("/contacts?isCompany=true&limit=300");
    setCompanyRecords(r.data.map(mapContact));
  };

  const createContact = async (name: string) => {
    const r = await api.post<any>("/contacts", { name, type: "customer" });
    await loadContacts();
    setContactId(r.data.id);
    await loadContactFields(r.data.id);
  };

  // 在「所属公司」选择器中即时创建公司（isCompany=true），建好后回填 parentId
  const createCompany = async (name: string) => {
    const r = await api.post<any>("/contacts", {
      name,
      type: "customer",
      isCompany: true,
    });
    await loadCompanies();
    await loadContacts();
    setContact((c) => ({ ...c, parentId: r.data.id }));
  };

  const loadContactFields = async (rid: string | null) => {
    if (!rid) {
      setContact((c) => ({
        ...c,
        name: "",
        email: "",
        phone: "",
        customerType: "",
        country: "",
        website: "",
        company: "",
        parentId: "",
        isCompany: false,
      }));
      return;
    }
    const r = await api.get<any>(`/contacts/${rid}`);
    const c = r.data;
    setContact((prev) => ({
      ...prev,
      name: c.name ?? "",
      type: c.type ?? "customer",
      customerType: c.customerType ?? "",
      company: c.company ?? "",
      parentId: c.parentId ?? "",
      isCompany: c.isCompany ?? false,
      email: c.email ?? "",
      phone: c.phone ?? "",
      country: c.country ?? "",
      website: c.website ?? "",
      aiGenerated: c.aiGenerated ?? false,
    }));
  };

  // 同一客户（往来单位/联系人）下的其他商机数量（产物栏「类似商机」展示）
  const [similarCount, setSimilarCount] = useState(0);
  const [customerContactId, setCustomerContactId] = useState<string | null>(null);
  useEffect(() => {
    if (!isEdit || !id) return;
    let alive = true;
    api
      .get<{ id: string }[]>("/quotations", { params: { dealId: id } })
      .then((r) => {
        if (alive) setQuoteCount(r.data.length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isEdit, id, refreshToken]);

  // 同一客户的其他商机数量（产物栏「类似商机」计数）；保存/推进后随 refreshToken 刷新
  useEffect(() => {
    if (!isEdit || !id || !customerContactId) {
      setSimilarCount(0);
      return;
    }
    let alive = true;
    api
      .get<{ count: number }>(`/crm/deals/by-contact/${customerContactId}/count`, {
        params: { excludeDealId: id },
      })
      .then((r) => {
        if (alive) setSimilarCount(r.data.count);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isEdit, id, customerContactId, refreshToken]);

  const leadStageId = stages[0]?.id ?? null;

  const currentStageIndex =
    isEdit && detail ? stages.findIndex((s) => s.id === detail.stage.id) : -1;

  // 成交概率：按当前销售阶段进度推算（阶段越靠后成交概率越高），只读展示。
  // 新建默认落首阶段（线索），故以 lead 阶段计；编辑态取实际所在阶段下标。
  const probabilityPct = useMemo<number | null>(() => {
    if (!stages.length) return null;
    const idx = isEdit ? currentStageIndex : 0;
    if (idx < 0) return null;
    // 线索到达阶段暂时固定显示为 0%
    if (stages[idx]?.key === "lead") return 0;
    return Math.round(((idx + 1) / stages.length) * 100);
  }, [stages, currentStageIndex, isEdit]);

  // 下一阶段（用于「确认 / 报价」等推进按钮）：取当前阶段在有序列表中的下一项
  const nextStage =
    isEdit && currentStageIndex >= 0 ? stages[currentStageIndex + 1] : undefined;
  // 推进按钮文案：线索到达→需求确认 显示「确认」，需求确认→报价阶段 显示「报价」，其余阶段用通用文案
  const advanceLabel =
    detail?.stage.key === "lead"
      ? t("crm.confirmStage")
      : detail?.stage.key === "qualify"
        ? t("crm.quoteStage")
        : nextStage
          ? `推进到「${nextStage.title}」`
          : null;

  // 每个阶段停留时长：leftAt 为空表示当前阶段（用当前时间计算进行中时长）
  const stageDurations: Record<string, string> = {};
  if (detail?.stageLogs) {
    for (const log of detail.stageLogs) {
      const end = log.leftAt ? new Date(log.leftAt).getTime() : Date.now();
      const ms = Math.max(0, end - new Date(log.enteredAt).getTime());
      stageDurations[log.stageId] = formatDwell(ms);
    }
  }

  // 讨论区：拉取更早一页（before=最旧已加载消息 createdAt），用于瀑布流
  const loadOlderChatter = async (oldest: ChatterMessage) => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/crm/deals/${id}/chatter?limit=30&before=${encodeURIComponent(oldest.createdAt ?? "")}`,
    );
    return {
      messages: r.data.messages.map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };

  // 讨论区：增量刷新最新一屏并合并（发消息/保存/推进阶段后）
  const loadLatestChatter = async () => {
    const r = await api.get<{ messages: ChatterMessage[]; hasMore: boolean }>(
      `/crm/deals/${id}/chatter?limit=30`,
    );
    return {
      messages: r.data.messages.map((m) => ({
        ...m,
        sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
      })),
      hasMore: r.data.hasMore,
    };
  };

  // 新建页：机器人先本地显示「正在创建」占位消息，保存成功跳详情后由服务端真实记录替换
  const newDealChatter = useMemo<ChatterMessage[]>(
    () => [
      {
        id: "bot-creating",
        author: "ominXBot",
        initials: "🤖",
        body: "正在创建商机中。。。", 
        isBot: true,
      },
    ],
    [],
  );

  // 编辑：拉取详情并回填（含讨论区初始分页）
  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setDetail(null);
    (async () => {
      try {
        const r = await api.get<DealDetailData>(`/crm/deals/${id}`);
        if (cancelled) return;
        const d = r.data;
        setDetail(d);
        // 记录该商机关联的客户（往来单位/联系人）id，用于「类似商机」统计
        setCustomerContactId(d.contact?.id ?? null);
        setAssignee(d.assignee ?? "");
        const matched = users.find((u) => u.name === d.assignee);
        setSalespersonId(matched?.id ?? user?.id ?? "");
        setSource(d.source ?? "");
        setDescription(d.description ?? "");
        setPriceIncludeTax(d.priceIncludeTax ?? true);
        setContact({
          ...EMPTY_CONTACT,
          name: d.contact?.name ?? "",
          type: d.contact?.type ?? "customer",
          customerType: d.contact?.customerType ?? "",
          company: d.contact?.company ?? "",
          parentId: d.contact?.parentId ?? "",
          isCompany: d.contact?.isCompany ?? false,
          email: d.contact?.email ?? "",
          phone: d.contact?.phone ?? "",
          country: d.contact?.country ?? "",
          website: d.contact?.website ?? "",
          aiGenerated: d.contact?.aiGenerated ?? false,
        });
        // 编辑回填：往来单位/联系人直接回填该记录（扁平模型，无公司层级）
        setContactId(d.contact?.id ?? null);
        await loadContactFields(d.contact?.id ?? null);
        // 优先从订单明细 JSON 恢复整张表（含组合/备注/排序，行级数量与折扣随行）；
        // 旧数据无 lines 时回退到遗留单产品
        const restored = d.linesJson
          ? (() => {
              try {
                const arr = JSON.parse(d.linesJson);
                return Array.isArray(arr) && arr.length
                  ? (arr as OrderLine[]).map(normalizeRestoredLine)
                  : null;
              } catch {
                return null;
              }
            })()
          : null;
        setLines(restored ?? (d.product ? [productToLine(d.product)] : [emptyLine()]));
        // 讨论区初始分页：拉取最新一屏
        const chatterR = await api.get<{
          messages: ChatterMessage[];
          hasMore: boolean;
        }>(`/crm/deals/${id}/chatter?limit=30`);
        if (cancelled) return;
        setInitialChatter(
          chatterR.data.messages.map((m) => ({
            ...m,
            sentAt: m.createdAt ? Date.parse(m.createdAt) : undefined,
          })),
        );
        setChatterHasMore(chatterR.data.hasMore);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  // 商机名称自动组成：首个产品描述 + 总数量 + 客户国别（不可手动输入）
  const hasProduct = lines.some(
    (l) => l.type === "product" && (l.description.trim() || l.productId),
  );
  const canSave = !saving && !!contact.name.trim() && hasProduct;

  const productLines = lines.filter((l) => l.type === "product");
  const primaryLine = productLines[0];
  const multiProduct = productLines.length > 1;
  const totalQty = productLines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const titleDesc =
    (primaryLine?.description?.trim() ?? "") +
    (multiProduct && primaryLine?.description?.trim() ? "等" : "");
  const composedTitle = [
    titleDesc,
    totalQty ? String(totalQty) : "",
    contact.country.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  // 预期收入 = 明细合计（由订单明细自动计算，含组合数量）
  const expectedRevenue = linesTotal(lines);

  const buildPayload = () => ({
    title: composedTitle.trim() || undefined,
    description: description.trim() || undefined,
    assignee: assignee.trim() || undefined,
    // 业务员头像选择器同时承担「创建人 + 负责人」
    ownerId: salespersonId || undefined,
    creatorId: salespersonId || undefined,
    source: source.trim() || undefined,
    // 关联往来单位：优先选中的联系人；姓名必填（无姓名不建往来单位）
    contactId: contact.name.trim() ? contactId ?? undefined : undefined,
    contact: contact.name.trim()
      ? {
          name: contact.name.trim(),
          type: contact.type || "customer",
          customerType: contact.customerType.trim() || undefined,
          parentId: contact.parentId || undefined,
          email: contact.email.trim() || undefined,
          phone: contact.phone.trim() || undefined,
          country: contact.country.trim() || undefined,
          website: contact.website.trim() || undefined,
        }
      : undefined,
    // 兼容历史单产品字段（取首个产品行），其余明细以 lines 全量保存
    product: {
      description: primaryLine?.description?.trim() || undefined,
      price: primaryLine ? primaryLine.price : undefined,
      tax: primaryLine ? primaryLine.taxRate : undefined,
      quantity: primaryLine ? primaryLine.quantity : undefined,
      unit: primaryLine?.unit?.trim() || undefined,
    },
    priceIncludeTax,
    // 订单明细整张表随商机保存（行级数量/折扣随行）；空 productId 的新产品行由后端建产品库
    lines: lines.map((l) => ({
      id: l.id,
      parentId: l.parentId ?? null,
      type: l.type,
      name: l.name,
      productId: l.productId ?? null,
      description: l.description,
      quantity: typeof l.quantity === "number" ? l.quantity : 0,
      unit: l.unit,
      price: l.price,
      costPrice: l.costPrice,
      taxRate: l.taxRate,
      taxId: l.taxId ?? null,
      discount: l.discount,
      image: l.image || null,
      sourceProductUrl: l.sourceProductUrl ?? null,
      sourceProductId: l.sourceProductId ?? null,
    })),
  });

  // 在 Chatter 中发布一条人工评论（区别于机器人操作记录）；返回服务端消息供组件回填
  const handleChatterSend = async (text: string): Promise<ChatterMessage | void> => {
    if (!isEdit || !id) return;
    try {
      const r = await api.post<ChatterMessage>(`/crm/deals/${id}/chatter`, { text });
      return {
        ...r.data,
        sentAt: r.data.createdAt ? Date.parse(r.data.createdAt) : undefined,
      };
    } catch (e) {
      console.error("[DealForm] post chatter failed:", e);
      toast.error(t("crm.saveFailed"));
      throw e;
    }
  };

  // 撤回一条本人发送、3 分钟内的评论（乐观更新已在组件内完成，这里负责持久化删除）
  const handleChatterRecall = async (msgId: string) => {
    if (!isEdit || !id) return;
    try {
      await api.delete(`/crm/deals/${id}/chatter/${msgId}`);
    } catch (e) {
      console.error("[DealForm] recall chatter failed:", e);
      toast.error(t("chatter.recallFailed"));
      throw e; // 交由 Chatter 本地回滚乐观更新
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit && id) {
        await api.patch(`/crm/deals/${id}`, buildPayload());
        const r = await api.get<DealDetailData>(`/crm/deals/${id}`);
        setDetail(r.data);
        setRefreshToken((k) => k + 1); // 增量刷新讨论区，显示本次操作相关的系统记录
        toast.success(t("crm.saveSuccess"));
      } else {
        const res = await api.post("/crm/deals", {
          ...buildPayload(),
          stageId: leadStageId ?? undefined,
        });
        const newId: string = res.data.id;
        toast.success(t("crm.createSuccess"));
        navigate(`/crm/deals/${newId}`, { replace: true });
      }
    } catch (e) {
      // 保存失败 ≠ 商机不存在（后者仅用于编辑加载失败）：保留表单，就地精确提示
      console.error("[DealForm] save failed:", e);
      setSaveError(extractErrorDetail(e));
    } finally {
      setSaving(false);
    }
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/crm/deals/${id}`);
      toast.success(t("crm.delete") + " " + t("common.success"));
      navigate("/crm");
    } catch (e) {
      setDeleteOpen(false);
      console.error("[DealForm] delete failed:", e);
      toast.error(extractErrorDetail(e) || t("crm.saveFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={isEdit ? t("crm.detailTitle") : t("crm.formTitle")}
        back={() => navigate("/crm")}
        actions={
          isEdit ? (
            <div className="flex items-center gap-2">
              {nextStage && (
                <Button onClick={handleAdvanceStage} disabled={moving}>
                  {moving ? t("crm.advancing") : advanceLabel}
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                {t("crm.delete")}
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* 阶段条：顶栏中央，纯展示（不可切换） */}
      {isEdit && detail && stages.length > 0 && (
        <HeaderCenter>
          <StageStepper stages={stages} currentId={detail.stage.id} durations={stageDurations} />
        </HeaderCenter>
      )}

      {loading && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("auth.loading")}
        </div>
      )}
      {!loading && error && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {t("crm.notFound")}
        </div>
      )}

      {!loading && !error && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-10">
          {/* 商机信息（6） */}
          <Card className="flex min-h-0 flex-col lg:col-span-6">
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
            {/* 头部 */}
            <div className="flex flex-col gap-3">
              {/* 第一行：商机名称（自动组成） + 右侧业务员头像 */}
              <div className="flex items-center justify-between gap-3">
                <h1 className="min-w-0 flex-1 break-all font-heading text-2xl font-semibold tracking-tight text-foreground">
                  {composedTitle || "—"}
                </h1>
                <SalespersonPicker
                  users={users}
                  value={salespersonId}
                  onChange={handleSalespersonChange}
                  searchMoreTitle={t("crm.selectSalesperson")}
                  className="shrink-0"
                />
              </div>

              {/* 第二行：预期收入（单价×数量自动计算） at 概率（按当前阶段推算） */}
              <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {t("crm.expectedRevenue")}
                  </span>
                  <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
                    {formatMoney(expectedRevenue)}
                  </span>
                </div>
                <span className="pb-0.5 text-sm text-muted-foreground">at</span>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {t("crm.probability")}
                    <span className="bg-gradient-to-r from-violet-500 to-amber-500 bg-clip-text text-[10px] font-bold text-transparent">
                      AI
                    </span>
                  </span>
                  <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
                    {probabilityPct != null ? `${probabilityPct}%` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 往来单位 / 联系人 */}
            <section className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4">
                {/* 左列 */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-contact-name" className="flex items-center gap-1.5">
                      {t("contact.name")}
                      {!isEdit && <span className="text-red-500"> *</span>}
                      {contact.aiGenerated && !isContactComplete(contact) && (
                        <Badge
                          variant="outline"
                          className="border-amber-500 text-amber-600"
                          title={t("contact.aiPendingHint")}
                        >
                          {t("contact.aiPending")}
                        </Badge>
                      )}
                    </Label>
                    <Picker
                      id="deal-contact-name"
                      records={contacts}
                      value={contactId}
                      topN={5}
                      searchMoreTitle={t("contact.name")}
                      placeholder={t("contact.namePlaceholder")}
                      onChange={(rec) => {
                        setContactId(rec?.id ?? null);
                        void loadContactFields(rec?.id ?? null);
                      }}
                      onCreate={(name) => void createContact(name)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-cust-company">{t("contact.company")}</Label>
                    <Picker
                      id="deal-cust-company"
                      records={companyRecords}
                      value={contact.parentId || null}
                      topN={5}
                      searchMoreTitle={t("contact.company")}
                      placeholder={t("contact.companyPlaceholder")}
                      onChange={(rec) =>
                        setContact((c) => ({ ...c, parentId: rec?.id ?? "" }))
                      }
                      onCreate={(name) => void createCompany(name)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-contact-email">{t("contact.email")}</Label>
                    <Input
                      id="deal-contact-email"
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-contact-phone">{t("contact.phone")}</Label>
                    <Input
                      id="deal-contact-phone"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    />
                  </div>
                </div>
                {/* 右列 */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-source">{t("crm.fieldSource")}</Label>
                    <Picker
                      id="deal-source"
                      records={DEAL_SOURCE_RECORDS}
                      value={source}
                      topN={7}
                      searchMoreTitle={t("crm.fieldSource")}
                      placeholder={t("crm.fieldSourcePlaceholder")}
                      fallbackText={source}
                      onChange={(rec) => setSource(rec?.label ?? "")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-customer-type">
                      {t("crm.fieldCustomerType")}
                    </Label>
                    <Picker
                      id="deal-customer-type"
                      records={DEAL_CUSTOMER_TYPE_RECORDS}
                      value={contact.customerType}
                      topN={7}
                      searchMoreTitle={t("crm.fieldCustomerType")}
                      placeholder={t("crm.fieldCustomerTypePlaceholder")}
                      fallbackText={contact.customerType}
                      onChange={(rec) =>
                        setContact((c) => ({
                          ...c,
                          customerType: rec?.label ?? "",
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-cust-country">{t("contact.country")}</Label>
                    <Picker
                      id="deal-cust-country"
                      records={DEAL_COUNTRY_RECORDS}
                      value={contact.country}
                      topN={6}
                      searchMoreTitle={t("contact.country")}
                      placeholder={t("contact.countryPlaceholder")}
                      fallbackText={contact.country}
                      onChange={(rec) =>
                        setContact((c) => ({
                          ...c,
                          country: rec?.label ?? "",
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-cust-website">{t("contact.website")}</Label>
                    <Input
                      id="deal-cust-website"
                      type="url"
                      placeholder="https://"
                      value={contact.website}
                      onChange={(e) => setContact({ ...contact, website: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 产品需求 / 备注：Tab 切换 + 右侧含税/不含税胶囊（仅产品需求 Tab 显示） */}
            <Tabs
              value={productTab}
              onValueChange={setProductTab}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="product">{t("crm.tabProduct")}</TabsTrigger>
                  <TabsTrigger value="desc">{t("crm.fieldDesc")}</TabsTrigger>
                </TabsList>
                {productTab === "product" && (
                  <PillToggle
                    options={[
                      { value: "excluded", label: t("orderLines.taxExcluded") },
                      { value: "included", label: t("orderLines.taxIncluded") },
                    ]}
                    value={priceIncludeTax ? "included" : "excluded"}
                    onChange={(v) => setPriceIncludeTax(v === "included")}
                  />
                )}
              </div>

              {/* 产品需求（可编辑订单明细：描述内嵌产品选择、组合、备注、拖拽、折叠） */}
              <TabsContent value="product" className="flex flex-col gap-3">
                <OrderLinesTable
                  products={products}
                  lines={lines}
                  onLinesChange={setLines}
                  currency="¥"
                  priceIncludeTax={priceIncludeTax}
                />
              </TabsContent>

              {/* 备注 */}
              <TabsContent value="desc" className="flex flex-col gap-1.5">
              <Label htmlFor="deal-desc">{t("crm.fieldDesc")}</Label>
              <Textarea
                id="deal-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              </TabsContent>
            </Tabs>

            {error && <p className="text-sm text-red-500">{t("crm.createFailed")}</p>}
            </div>
            {/* 底部操作栏：左侧产物栏（固定单据，到达对应阶段才出现），右侧取消/保存 */}
            <div className="flex shrink-0 items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                {DELIVERABLES.filter((d) => currentStageIndex >= d.minStage).map(
                  (d) => {
                    const Icon = d.icon;
                    const label = t(`crm.deliverables.${d.key}`);
                    // 「报价」产物：显示真实报价单数量，点击查看该商机的报价单列表
                    if (d.key === "quote" && isEdit && id) {
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
                          title={label}
                          onClick={() => navigate(`/quotations?dealId=${id}`)}
                        >
                          <Icon className="size-4 shrink-0 text-amber-500" />
                          <span className="max-w-24 truncate text-xs text-muted-foreground">
                            {label}
                          </span>
                          <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                            {quoteCount}
                          </span>
                        </button>
                      );
                    }
                    return (
                      <div
                        key={d.key}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1"
                        title={label}
                      >
                        <Icon className="size-4 shrink-0 text-amber-500" />
                        <span className="max-w-24 truncate text-xs text-muted-foreground">
                          {label}
                        </span>
                        <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                          0
                        </span>
                      </div>
                    );
                  },
                )}
                {/* 类似商机：同一客户下的其他商机数量（多于 1 条时出现） */}
                {similarCount >= 1 && (
                  <div
                    key="similar"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1"
                    title={t("crm.deliverables.similarDeals")}
                  >
                    <Repeat className="size-4 shrink-0 text-sky-500" />
                    <span className="max-w-24 truncate text-xs text-muted-foreground">
                      {t("crm.deliverables.similarDeals")}
                    </span>
                    <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                      {similarCount}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {saveError && (
                  <span
                    className="max-w-md truncate text-sm text-destructive"
                    title={saveError}
                  >
                    {saveError}
                  </span>
                )}
                <Button type="button" variant="outline" onClick={() => navigate("/crm")}>
                  {t("common.cancel")}
                </Button>
                <Button type="button" onClick={() => void handleSave()} disabled={!canSave}>
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </Card>

          {/* Chatter（4） */}
          <div className="min-h-0 lg:col-span-4">
            {isEdit ? (
              initialChatter &&
              id && (
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
                  pollMs={15000}
                  followers={creatorName ? [creatorName] : undefined}
                />
              )
            ) : (
              <Chatter
                fill
                className="h-full"
                initialMessages={newDealChatter}
                currentUser={user?.name}
                followers={creatorName ? [creatorName] : undefined}
              />
            )}
          </div>
        </div>
      )}

      {/* 删除商机确认 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("crm.delete")}</DialogTitle>
            <DialogDescription>
              {t("crm.deleteConfirm", { title: detail?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
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
    </div>
  );
}
