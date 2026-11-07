import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

// ---------- 边框/样式辅助 ----------
const bd = { s: 1, cl: { rgb: "#000000" } };
const B = { t: bd, b: bd, l: bd, r: bd };

const styles = {
  // LOGO / 认证图片占位区（用户后续插入图片）
  logo: { ht: 2, vt: 2, fs: 11, cl: { rgb: "#999999" }, bd: B },
  // 公司抬头（多行文本）
  company: { fs: 11, bl: 1, ht: 2, vt: 2, tb: 3 },
  // TO 客户
  to: { fs: 11, ht: 1, vt: 1, tb: 3 },
  // 报价单大标题（红）
  titleRed: { fs: 22, bl: 1, ht: 2, vt: 2, cl: { rgb: "#ff0000" } },
  // 单号
  no: { fs: 12, ht: 3, vt: 2 },
  // QUOTATION 英文副标
  quoteEn: { fs: 14, bl: 1, ht: 2, vt: 2 },
  // 区块标题（产品图片 / 内容摘要 / 工厂展示）
  section: { fs: 12, bl: 1, ht: 2, vt: 2, bg: { rgb: "#dbe5f1" }, bd: B },
  // 内容摘要标签列
  label: { fs: 11, bl: 1, ht: 2, vt: 2, bd: B },
  // 内容摘要值列
  value: { fs: 11, ht: 2, vt: 2, tb: 3, bd: B },
  // 含税价（红字黄底）
  price: { fs: 12, bl: 1, ht: 2, vt: 2, cl: { rgb: "#ff0000" }, bg: { rgb: "#ffff00" }, bd: B },
  // 红字值（生产时间）
  redValue: { fs: 11, ht: 2, vt: 2, cl: { rgb: "#ff0000" }, bd: B },
  // 图片占位大区（产品图 / 工厂图）
  imgArea: { ht: 2, vt: 2, fs: 11, cl: { rgb: "#bbbbbb" }, bd: B },
  // 底部备注
  note: { fs: 11, ht: 1, vt: 2, tb: 3 },
};

// 内容摘要行（标签 / 值 / 样式）
const summaryRows = [
  ["产品名称", "武士尖叫鸡", "value"],
  ["产品材料", "环保PVC 质检标准: AQL1.0-2.5", "value"],
  ["产品尺寸", "尺寸约28cm，重量约120g", "value"],
  ["包装方式", "单个—OPP袋 五层瓦楞纸箱", "value"],
  ["装箱", "预估25pcs/箱，箱规60*35*30cm，毛重约4kg", "value"],
  ["3D设计费用", "造型设计共计1200元（不含彩色渲染，整体时间20天左右 好需需确认）", "value"],
  ["模具费", "9500元/20-25天", "value"],
  ["数量", "5000", "value"],
  ["备注", "OPP袋+贴标签，五层瓦楞外箱，含专票", "value"],
  ["【含税不含运价】", "¥6.30", "price"],
  ["生产时间", "样品确认后30-35天左右", "redValue"],
];
// 内容摘要起始行（0 基）：idx8 为区块标题行，标签从 idx9 到 idx19
const SUMMARY_START = 9;

const cellData = {
  // 表头：LOGO 区 / 公司抬头 / TO
  0: {
    0: { v: "LOGO / 认证图片区域", s: "logo" },
    4: { v: "江景元塑胶制品有限公司 & 义乌寿春塑胶制品有限公司\nPUJIANG JINGYUAN PLASTIC MANUFACTURING CO.,LTD & YIWU SHOUCHUN PLASTIC MANUFACTURING CO.,LTD\nAdd: 业务部: 浙江省义乌环球大厦2717室    厂址: 浙江省浦江郑家坞玩具小企业园区8栋一号\nTEL: 18899433776   Email: 18899433776@Blibo", s: "company" },
    6: { v: "TO:\n(客户名称)", s: "to" },
  },
  5: {
    0: { v: "报价单", s: "titleRed" },
    6: { v: "No.20260416002", s: "no" },
  },
  6: { 0: { v: "QUOTATION", s: "quoteEn" } },
  7: {
    0: { v: "产品图片", s: "section" },
    2: { v: "内容摘要", s: "section" },
  },
  8: { 0: { v: "（产品图片）", s: "imgArea" } },
  20: { 0: { v: "工厂生产车间展示图片", s: "section" } },
  21: { 0: { v: "（在此插入工厂车间图片）", s: "imgArea" } },
  27: { 0: { v: "备注：1. 此报价有效期6个月，", s: "note" } },
  28: { 0: { v: "2. 付款方式为：30%定金，验货合格后付尾款！", s: "note" } },
  29: { 0: { v: "如有未尽事宜，欢迎您的来电垂询。", s: "note" } },
  // ---- 产品明细（按行循环）：标题(32) / 表头(33) / 循环区域(34) ----
  32: { 0: { v: "产品明细（按行循环）", s: "section" } },
  33: {
    0: { v: "产品名称", s: "label" },
    1: { v: "描述", s: "label" },
    2: { v: "数量", s: "label" },
    3: { v: "单价", s: "label" },
    4: { v: "金额", s: "label" },
  },
  34: {
    0: { v: "{{line.name}}", s: "value" },
    1: { v: "{{line.description}}", s: "value" },
    2: { v: "{{line.quantity}}", s: "value" },
    3: { v: "{{line.price}}", s: "value" },
    4: { v: "{{line.amount}}", s: "value" },
  },
};
summaryRows.forEach(([label, value, style], i) => {
  const r = SUMMARY_START + i;
  cellData[r] = {
    2: { v: label, s: "label" },
    3: { v: value, s: style },
  };
});

const merges = [
  "A1:D5", "E1:F5", "G1:H5",
  "A6:F6", "G6:H6",
  "A7:H7",
  "A8:B8", "C8:H8",
  "A9:B19",
  ...summaryRows.map((_, i) => `D${SUMMARY_START + 1 + i}:H${SUMMARY_START + 1 + i}`),
  "A21:H21",
  "A22:H27",
  "A28:H28", "A29:H29", "A30:H30",
  "A33:H33",
];

// Univer 快照的 worksheet.mergeData 是 IRange[]（0 基对象），不是 "A1:D5" 字符串数组
const colNum = (s) => s.split("").reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
const toRange = (ref) => {
  const [from, to] = ref.split(":");
  const mF = from.match(/^([A-Z]+)(\d+)$/);
  const mT = to.match(/^([A-Z]+)(\d+)$/);
  return {
    startRow: Number(mF[2]) - 1,
    endRow: Number(mT[2]) - 1,
    startColumn: colNum(mF[1]),
    endColumn: colNum(mT[1]),
  };
};
const mergeData = merges.map(toRange);

const rowData = {
  5: { h: 40 }, // 报价单标题行加高
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [8 + i, { h: 30 }]), // 产品图 + 摘要区加高
  ),
  ...Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [21 + i, { h: 34 }]), // 工厂展示区加高
  ),
};

const snap = {
  id: "quotation-default",
  name: "默认模板",
  appVersion: "1.3.1",
  locale: "zh-CN",
  sheetOrder: ["sheet1"],
  styles,
  sheets: {
    sheet1: {
      id: "sheet1",
      name: "报价单",
      type: 0,
      rowCount: 40,
      columnCount: 8,
      defaultColumnWidth: 120,
      defaultRowHeight: 26,
      cellData,
      rowData,
      mergeData,
    },
  },
  // 循环明细配置：区域 = 第 34 行（0 基）横跨 A~E 列，按报价单 lines 逐行展开
  loopConfig: [{ sheetId: "sheet1", startRow: 34, startColumn: 0, endRow: 34, endColumn: 4 }],
};

// 1) 落 JSON 供 seed.ts 复用
writeFileSync(new URL("../prisma/default-quotation-snapshot.json", import.meta.url), JSON.stringify(snap, null, 2));
console.log("snapshot json written");

// 2) 更新库内默认模板
const prisma = new PrismaClient();
try {
  const existing = await prisma.quotationTemplate.findFirst({ where: { name: "默认模板" } });
  if (existing) {
    await prisma.quotationTemplate.update({ where: { id: existing.id }, data: { sheetSnapshot: snap } });
    console.log("updated default template -> screenshot layout");
  } else {
    await prisma.quotationTemplate.create({ data: { name: "默认模板", sheetSnapshot: snap } });
    console.log("created default template");
  }
} catch (e) {
  console.error("FIX ERROR:", e?.message ?? e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
