import { PrismaClient, Priority, ContactType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const stages = [
  { key: "lead", title: "线索到达", accent: "bg-slate-400" },
  { key: "qualify", title: "需求确认", accent: "bg-sky-500" },
  { key: "quote", title: "报价阶段", accent: "bg-violet-500" },
  { key: "sample", title: "样品流程", accent: "bg-cyan-500" },
  { key: "order", title: "正式订单", accent: "bg-blue-500" },
  { key: "pay", title: "订单支付", accent: "bg-emerald-500" },
  { key: "produce", title: "生产阶段", accent: "bg-amber-500" },
  { key: "ship", title: "物流运输", accent: "bg-teal-500" },
  { key: "finalpay", title: "尾款支付", accent: "bg-lime-500" },
  { key: "receive", title: "客户收货", accent: "bg-pink-500" },
  { key: "aftersale", title: "售后服务", accent: "bg-rose-500" },
];

type SeedDeal = {
  stageKey: string;
  title: string;
  description?: string;
  tag?: string;
  priority?: Priority;
  amount?: number;
  assignee?: string;
  meta?: string;
};

const deals: SeedDeal[] = [
  { stageKey: "lead", title: "星辰科技", description: "官网表单留资，咨询智能硬件方案", tag: "新签", priority: Priority.medium, assignee: "林", meta: "10-28" },
  { stageKey: "lead", title: "海蓝贸易", description: "展会扫码，进口零食渠道", assignee: "陈", meta: "10-29" },
  { stageKey: "lead", title: "优品家居", description: "广告投放点击，定制家具需求", assignee: "王", meta: "10-30" },
  { stageKey: "qualify", title: "远大建筑", description: "智慧工地平台，已约产品演示", tag: "新签", priority: Priority.high, assignee: "林", meta: "11-02" },
  { stageKey: "qualify", title: "味之源", description: "餐饮 SaaS，需求梳理中", tag: "续约", assignee: "李", meta: "11-01" },
  { stageKey: "quote", title: "锦程物流", description: "TMS 系统报价，待客户确认", amount: 86000, priority: Priority.medium, assignee: "陈", meta: "11-03" },
  { stageKey: "quote", title: "蓝海医疗", description: "设备采购，报价待内部审批", amount: 240000, priority: Priority.high, assignee: "王", meta: "11-05" },
  { stageKey: "sample", title: "美尚服饰", description: "定制工服样品寄送中", amount: 12000, assignee: "林", meta: "11-04" },
  { stageKey: "sample", title: "恒达五金", description: "样品已签收，待反馈", amount: 8500, assignee: "陈", meta: "10-31" },
  { stageKey: "order", title: "天工制造", description: "PO 已下，合同签署中", amount: 156000, priority: Priority.medium, assignee: "王", meta: "11-06" },
  { stageKey: "order", title: "云图传媒", description: "年度框架订单", amount: 320000, assignee: "李", meta: "11-07" },
  { stageKey: "pay", title: "盛世地产", description: "首付款已收", amount: 60000, assignee: "陈", meta: "11-08" },
  { stageKey: "produce", title: "宏图电子", description: "设备生产中，预计 11-20 完工", amount: 210000, priority: Priority.high, assignee: "王", meta: "11-20" },
  { stageKey: "produce", title: "佳和食品", description: "包材生产中", amount: 45000, assignee: "林", meta: "11-12" },
  { stageKey: "ship", title: "德信机械", description: "已发货，在途运输", amount: 98000, assignee: "陈", meta: "11-09" },
  { stageKey: "ship", title: "晨光文具", description: "国内快递，预计 2 天达", amount: 23000, assignee: "李", meta: "11-10" },
  { stageKey: "finalpay", title: "金辉建材", description: "尾款待付", amount: 40000, priority: Priority.medium, assignee: "王", meta: "11-15" },
  { stageKey: "receive", title: "瑞丰农业", description: "已签收，验收中", amount: 67000, assignee: "陈", meta: "11-11" },
  { stageKey: "aftersale", title: "百盛零售", description: "季度巡检 + 续费提醒", assignee: "李", meta: "11-30" },
  { stageKey: "aftersale", title: "同创科技", description: "培训交付完成", assignee: "王", meta: "11-13" },
];

async function main() {
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    await prisma.stage.upsert({
      where: { key: s.key },
      update: { title: s.title, accent: s.accent, position: i },
      create: { key: s.key, title: s.title, accent: s.accent, position: i },
    });
  }
  console.log(`✓ seeded ${stages.length} stages`);

  // 默认管理员账号（便于登录体验）；以 type=user 的统一联系人落库。已存在则同步密码，保证可登录。
  const adminEmail = "admin@omnix.dev";
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.contact.upsert({
    where: { email: adminEmail },
    update: { name: "管理员", type: ContactType.user, role: "admin", password: adminHash },
    create: {
      email: adminEmail,
      name: "管理员",
      type: ContactType.user,
      role: "admin",
      password: adminHash,
    },
  });
  console.log("✓ ensured admin contact (admin@omnix.dev / admin123)");

  // 系统级机器人 ominXBot：拥有最高权限（role=admin），负责把「创建 / 字段修改 / 阶段变更」
  // 等操作历史写入各单据的 Chatter。不可登录（password 为空），仅作系统操作记录作者身份。
  await prisma.contact.upsert({
    where: { email: "bot@omnix.dev" },
    update: { name: "ominXBot", type: ContactType.user, role: "admin", isSystem: true, password: null },
    create: {
      email: "bot@omnix.dev",
      name: "ominXBot",
      type: ContactType.user,
      role: "admin",
      isSystem: true,
      password: null,
      botCharacter: "mochi",
    },
  });
  console.log("✓ ensured system bot (ominXBot)");

  // 演示用「客户」类型联系人：联系人页的客户标签、商机「所属公司」下拉共用
  const customers: Array<{
    email: string;
    name: string;
    company: string;
    customerType: string | null;
    phone: string | null;
    country: string | null;
  }> = [
    { email: "lin@hengxing.com", name: "林经理", company: "深圳恒星电子", customerType: "跨境电商类型", phone: "138-0011-2233", country: "中国" },
    { email: "wang@yuan.cn", name: "王经理", company: "宁波远洋贸易", customerType: "传统贸易类型", phone: "139-0022-3344", country: "中国" },
    { email: "chen@jinggong.com", name: "陈工", company: "东莞精工模具", customerType: "品牌 & 代工类型", phone: "137-0033-4455", country: "中国" },
    { email: "zhao@liantuo.com", name: "赵经理", company: "上海联拓科技", customerType: "教育文旅类型", phone: "136-0044-5566", country: "中国" },
    { email: "sun@hina.com", name: "孙主管", company: "广州海纳塑胶", customerType: "渠道分销 & 代理类", phone: "135-0055-6677", country: "中国" },
    { email: "li@ruichi.com", name: "李经理", company: "苏州锐驰电机", customerType: "政企 & 单位采购类", phone: "134-0066-7788", country: "中国" },
    { email: "amy@yihao.com", name: "Amy", company: "Hangzhou Yihao", customerType: "跨境电商类型", phone: "+86-571-8888", country: "中国" },
    { email: "zhou@desheng.com", name: "周经理", company: "佛山德胜五金", customerType: "传统商超类型", phone: "133-0077-8899", country: "中国" },
  ];
  for (const c of customers) {
    await prisma.contact.upsert({
      where: { email: c.email },
      update: {
        name: c.name,
        company: c.company,
        type: ContactType.customer,
        customerType: c.customerType,
        phone: c.phone,
        country: c.country,
      },
      create: {
        email: c.email,
        name: c.name,
        company: c.company,
        type: ContactType.customer,
        customerType: c.customerType,
        phone: c.phone,
        country: c.country,
      },
    });
  }
  console.log(`✓ seeded ${customers.length} customer contacts`);

  // 演示用产品：清掉历史 description 为空的脏数据后，仅在无产品时写入
  await prisma.product.deleteMany({ where: { description: null } });
  if ((await prisma.product.count()) === 0) {
    const products = [
      { description: "无线蓝牙耳机 Pro", price: 299, tax: 13, quantity: 100, category: "消费电子", mode: "成品" },
      { description: "智能手环 S1", price: 199, tax: 13, quantity: 200, category: "消费电子", mode: "成品" },
      { description: "便携榨汁杯", price: 89, tax: 13, quantity: 300, category: "家居", mode: "成品" },
      { description: "工业级螺丝刀套装", price: 159, tax: 13, quantity: 150, category: "五金工具", mode: "成品" },
      { description: "定制工服（夏季）", price: 49, tax: 13, quantity: 500, category: "服饰定制", mode: "定制" },
      { description: "智能温控器", price: 359, tax: 13, quantity: 80, category: "智能家居", mode: "成品" },
    ];
    await prisma.product.createMany({ data: products });
    console.log(`✓ seeded ${products.length} products`);
  } else {
    console.log("✓ products already exist, skip");
  }

  const existing = await prisma.deal.count();
  const byKey = await prisma.stage.findMany();
  const keyToId = Object.fromEntries(byKey.map((s) => [s.key, s.id]));
  if (existing === 0) {
    let pos = 0;
    let lastStage = "";
    for (const d of deals) {
      if (d.stageKey !== lastStage) {
        pos = 0;
        lastStage = d.stageKey;
      }
      await prisma.deal.create({
        data: {
          title: d.title,
          description: d.description,
          tag: d.tag,
          priority: d.priority ?? Priority.medium,
          amount: d.amount,
          assignee: d.assignee,
          meta: d.meta,
          stageId: keyToId[d.stageKey],
          position: pos++,
        },
      });
    }
    console.log(`✓ seeded ${deals.length} deals`);
  } else {
    console.log("✓ deals already exist, skip");
  }

  // 阶段停留日志回填：仅为「还没有任何阶段日志」的商机（种子演示商机）重建停留路径。
  // 已存在日志的商机（用户新建的）保留其真实停留时间，避免被随机时长覆盖。
  const dealsForLog = await prisma.deal.findMany({
    where: { stageLogs: { none: {} } },
    select: { id: true, stageId: true },
  });
  const stageList = [...byKey].sort((a, b) => a.position - b.position);
  const stageIndex = Object.fromEntries(stageList.map((s, i) => [s.id, i]));
  for (const d of dealsForLog) {
    const k = stageIndex[d.stageId] ?? 0;
    // 先清空旧日志，再按 阶段0..k 顺序写入（前序阶段闭合、当前阶段进行中）
    await prisma.dealStageLog.deleteMany({ where: { dealId: d.id } });
    let cursor = Date.now();
    for (let j = 0; j <= k; j++) {
      const span = (Math.floor(Math.random() * 10) + 1) * 86400000;
      const st = stageList[j];
      await prisma.dealStageLog.create({
        data: {
          dealId: d.id,
          stageId: st.id,
          stageKey: st.key,
          stageTitle: st.title,
          enteredAt: new Date(cursor - span),
          leftAt: j < k ? new Date(cursor) : null,
        },
      });
      cursor -= span;
    }
  }
  console.log(`✓ seeded stage logs for ${dealsForLog.length} deals`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
