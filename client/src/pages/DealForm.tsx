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
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, userInitials } from "@/lib/auth";
import { toast } from "sonner";
import { PageMeta } from "@/components/layout/PageMeta";
import { HeaderCenter } from "@/components/layout/AppShell";
import { StageStepper, type StageOption } from "@/components/crm/StageStepper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PillToggle } from "@/components/common/PillToggle";
import type { SalesPerson } from "@/components/common/SalespersonPicker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Chatter, type ChatterMessage } from "@/components/chatter/Chatter";
import type { ContactValues } from "@/components/crm/ContactForm";
import { EMPTY_CONTACT } from "@/components/crm/ContactForm";
import type { ProductValues } from "@/components/crm/ProductForm";
import { OrderLinesTable, TAXES, type OrderLine } from "@/components/crm/OrderLinesTable";
import { Picker } from "@/components/common/Picker";
import { SearchableSelect, type SelectRecord } from "@/components/common/SearchableSelect";

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
const DEAL_SOURCE_RECORDS: SelectRecord[] = [
  "1688景元店",
  "国际站寿春店",
  "国家站微它店",
  "展会",
  "转介绍",
  "社媒",
].map((s) => ({ id: s, label: s }));

// 演示用客户类型（Picker 下拉用，id 与 label 一致）
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

// 演示用「客户」类型联系人（所属公司下拉用，type=customer）
const DEAL_CUSTOMER_CONTACTS: SelectRecord[] = [
  { id: "c1", label: "深圳恒星电子", sublabel: "林经理", usage: 42, details: [{ label: "电话", value: "138-0011-2233" }, { label: "邮箱", value: "lin@hengxing.com" }, { label: "国家", value: "中国" }] },
  { id: "c2", label: "宁波远洋贸易", sublabel: "王经理", usage: 38, details: [{ label: "电话", value: "139-0022-3344" }, { label: "邮箱", value: "wang@yuan.cn" }, { label: "国家", value: "中国" }] },
  { id: "c3", label: "东莞精工模具", sublabel: "陈工", usage: 31, details: [{ label: "电话", value: "137-0033-4455" }, { label: "邮箱", value: "chen@jinggong.com" }, { label: "国家", value: "中国" }] },
  { id: "c4", label: "上海联拓科技", sublabel: "赵经理", usage: 27, details: [{ label: "电话", value: "136-0044-5566" }, { label: "邮箱", value: "zhao@liantuo.com" }, { label: "国家", value: "中国" }] },
  { id: "c5", label: "广州海纳塑胶", sublabel: "孙主管", usage: 24, details: [{ label: "电话", value: "135-0055-6677" }, { label: "邮箱", value: "sun@haina.com" }, { label: "国家", value: "中国" }] },
  { id: "c6", label: "苏州锐驰电机", sublabel: "李经理", usage: 19, details: [{ label: "电话", value: "134-0066-7788" }, { label: "邮箱", value: "li@ruichi.com" }, { label: "国家", value: "中国" }] },
  { id: "c7", label: "Hangzhou Yihao", sublabel: "Amy", usage: 15, details: [{ label: "电话", value: "+86-571-8888" }, { label: "邮箱", value: "amy@yihao.com" }, { label: "国家", value: "中国" }] },
  { id: "c8", label: "佛山德胜五金", sublabel: "周经理", usage: 12, details: [{ label: "电话", value: "133-0077-8899" }, { label: "邮箱", value: "zhou@desheng.com" }, { label: "国家", value: "中国" }] },
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
    // 默认税项：13% 货 专票（与 OrderLinesTable 的 TAXES 中该记录 id 一致）
    taxId: "tax-13g-s",
    taxRate: 13,
    discount: 0,
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
    unit: "",
    price: Number(p.price) || 0,
    taxRate,
    // 按税率回填一个默认税项（如 13% → 13% 货 专票）；无法区分货/服、专票/其他票时取首个
    taxId: TAXES.find((t) => t.label.startsWith(`${taxRate}%`))?.id ?? null,
    discount: 0,
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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [lines, setLines] = useState<OrderLine[]>(() => [emptyLine()]);
  // Chatter 操作/讨论记录（由系统机器人 ominXBot 写入操作历史 + 人工评论）
  const [chatter, setChatter] = useState<ChatterMessage[]>([]);
  const [chatterKey, setChatterKey] = useState(0);
  // 价格含税方式：true=含税（默认），false=不含税
  const [priceIncludeTax, setPriceIncludeTax] = useState(true);
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

  // 负责人下拉数据：支持搜索 + 「搜索更多」分页弹窗（仿 Odoo many2one）
  const salespersonRecords = useMemo<SelectRecord[]>(
    () =>
      users.map((u) => ({
        id: u.id,
        label: u.name,
        sublabel: u.email,
        avatarText: userInitials(u.name),
      })),
    [users],
  );

  // 创建人 = 当前选中的负责人（两者统一）；自动计入关注人。
  const creatorName = salespersonRecords.find((r) => r.id === salespersonId)?.label;

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

  // 确认线索：将阶段从「线索到达」推进到「需求确认」
  const handleAdvanceStage = async () => {
    if (!isEdit || !id) return;
    const next = stages.find((s) => s.key === "qualify");
    if (!next) return;
    setMoving(true);
    try {
      await api.patch(`/crm/deals/${id}`, { stageId: next.id });
      const r = await api.get<DealDetailData>(`/crm/deals/${id}`);
      setDetail(r.data);
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
  }, []);

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

  // 每个阶段停留时长：leftAt 为空表示当前阶段（用当前时间计算进行中时长）
  const stageDurations: Record<string, string> = {};
  if (detail?.stageLogs) {
    for (const log of detail.stageLogs) {
      const end = log.leftAt ? new Date(log.leftAt).getTime() : Date.now();
      const ms = Math.max(0, end - new Date(log.enteredAt).getTime());
      stageDurations[log.stageId] = formatDwell(ms);
    }
  }

  // 拉取商机的 Chatter 消息流（机器人操作历史 + 评论），并通过 key 重置组件内部状态
  const loadChatter = async (dealId: string) => {
    try {
      const r = await api.get<ChatterMessage[]>(`/crm/deals/${dealId}/chatter`);
      setChatter(r.data);
      setChatterKey((k) => k + 1);
    } catch {
      /* 忽略 chatter 加载失败，不影响主流程 */
    }
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

  // 编辑：拉取详情并回填
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    setError(false);
    setDetail(null);
    api
      .get<DealDetailData>(`/crm/deals/${id}`)
      .then((r) => {
        const d = r.data;
        setDetail(d);
        setAssignee(d.assignee ?? "");
        const matched = users.find((u) => u.name === d.assignee);
        setSalespersonId(matched?.id ?? user?.id ?? "");
        setSource(d.source ?? "");
        setDescription(d.description ?? "");
        setContact({
          ...EMPTY_CONTACT,
          name: d.contact?.name ?? "",
          type: d.contact?.type ?? "customer",
          customerType: d.contact?.customerType ?? "",
          company: d.contact?.company ?? "",
          email: d.contact?.email ?? "",
          phone: d.contact?.phone ?? "",
          country: d.contact?.country ?? "",
          website: d.contact?.website ?? "",
        });
        // 编辑回填：按公司名称匹配所属公司的客户联系人 id
        const matchedCompany = DEAL_CUSTOMER_CONTACTS.find(
          (c) => c.label === d.contact?.company,
        );
        setCompanyId(matchedCompany?.id ?? null);
        setLines(d.product ? [productToLine(d.product)] : [emptyLine()]);
        loadChatter(id);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  // 商机名称自动组成：首个产品描述 + 总数量 + 客户国别（不可手动输入）
  const hasProduct = lines.some(
    (l) => l.type === "product" && (l.description.trim() || l.productId),
  );
  const canSave =
    !saving &&
    (!isEdit ||
      (!!contact.name.trim() || !!contact.company.trim()) && hasProduct);

  const primaryLine = lines.find((l) => l.type === "product");
  const totalQty = lines
    .filter((l) => l.type === "product")
    .reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const composedTitle = [
    primaryLine?.description?.trim() ?? "",
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
    contact: {
      name: contact.name.trim() || contact.company.trim() || undefined,
      type: contact.type || "customer",
      customerType: contact.customerType.trim() || undefined,
      company: contact.company.trim() || undefined,
      email: contact.email.trim() || undefined,
      phone: contact.phone.trim() || undefined,
      country: contact.country.trim() || undefined,
      website: contact.website.trim() || undefined,
    },
    // 兼容历史单产品字段（取首个产品行），其余明细以 lines 全量保存
    product: {
      description: primaryLine?.description?.trim() || undefined,
      price: primaryLine ? primaryLine.price : undefined,
      tax: primaryLine ? primaryLine.taxRate : undefined,
      quantity: primaryLine ? primaryLine.quantity : undefined,
    },
    priceIncludeTax,
    lines,
  });

  // 在 Chatter 中发布一条人工评论（区别于机器人操作记录）
  const handleChatterSend = async (text: string) => {
    if (!isEdit || !id) return;
    try {
      await api.post(`/crm/deals/${id}/chatter`, { text });
      await loadChatter(id);
    } catch (e) {
      console.error("[DealForm] post chatter failed:", e);
      toast.error(t("crm.saveFailed"));
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
        loadChatter(id);
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={isEdit ? t("crm.detailTitle") : t("crm.formTitle")}
        back={() => navigate("/crm")}
        actions={
          isEdit && detail?.stage.key === "lead" ? (
            <Button onClick={handleAdvanceStage} disabled={moving}>
              {moving ? t("crm.advancing") : t("crm.confirmStage")}
            </Button>
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
                <SearchableSelect
                  records={salespersonRecords}
                  value={salespersonId}
                  onChange={(r) => r && handleSalespersonChange(r.id)}
                  placeholder={t("crm.salesperson")}
                  searchMoreTitle={t("crm.selectSalesperson")}
                  className="w-56"
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
                    <Label htmlFor="deal-cust-company">
                      {t("contact.company")}
                      {!isEdit && <span className="text-red-500"> *</span>}
                    </Label>
                    <Picker
                      id="deal-cust-company"
                      records={DEAL_CUSTOMER_CONTACTS}
                      value={companyId}
                      topN={5}
                      searchMoreTitle={t("contact.company")}
                      placeholder={t("contact.companyPlaceholder")}
                      fallbackText={companyId ? undefined : contact.company}
                      onChange={(rec) => {
                        setCompanyId(rec?.id ?? null);
                        setContact((c) => ({
                          ...c,
                          company: rec?.label ?? "",
                          // 选中客户联系人时自动带出姓名/邮箱/电话
                          name: rec?.sublabel ?? c.name,
                          email:
                            rec?.details?.find((d) => d.label === "邮箱")?.value ??
                            c.email,
                          phone:
                            rec?.details?.find((d) => d.label === "电话")?.value ??
                            c.phone,
                        }));
                      }}
                      onInputChange={(text) => {
                        setCompanyId(null);
                        setContact((c) => ({ ...c, company: text }));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deal-contact-name">{t("contact.name")}</Label>
                    <Input
                      id="deal-contact-name"
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
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
                      topN={6}
                      searchMoreTitle={t("crm.fieldSource")}
                      placeholder={t("crm.fieldSourcePlaceholder")}
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

            {/* 产品需求 / 备注：Tab 切换 + 右侧含税/不含税胶囊 */}
            <Tabs defaultValue="product" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="product">{t("crm.tabProduct")}</TabsTrigger>
                  <TabsTrigger value="desc">{t("crm.fieldDesc")}</TabsTrigger>
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

              {/* 产品需求（可编辑订单明细：描述内嵌产品选择、组合、备注、拖拽、折叠） */}
              <TabsContent value="product" className="flex flex-col gap-3">
                <OrderLinesTable
                  products={DEAL_PRODUCTS}
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
                    return (
                      <div
                        key={d.key}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1"
                        title={t(`crm.deliverables.${d.key}`)}
                      >
                        <Icon className="size-4 shrink-0 text-amber-500" />
                        <span className="max-w-24 truncate text-xs text-muted-foreground">
                          {t(`crm.deliverables.${d.key}`)}
                        </span>
                        <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
                          0
                        </span>
                      </div>
                    );
                  },
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
            <Chatter
              key={chatterKey}
              fill
              className="h-full"
              initialMessages={isEdit ? chatter : newDealChatter}
              currentUser={user?.name}
              onSend={isEdit && id ? handleChatterSend : undefined}
              followers={creatorName ? [creatorName] : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
