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

  const existing = await prisma.deal.count();
  if (existing === 0) {
    const byKey = await prisma.stage.findMany();
    const keyToId = Object.fromEntries(byKey.map((s) => [s.key, s.id]));
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
