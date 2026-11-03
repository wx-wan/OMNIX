/**
 * 一次性迁移脚本：把旧版「个人所属公司」自由文本（contact.company）转为
 * 关联公司（contact.parentId，自关联，贴近 Odoo 范式），并清空 company 文本。
 *
 * 规则：
 *  - 仅处理「个人」联系人（isCompany=false、非系统机器人）：company 文本非空且 parentId 为空。
 *  - 公司名（company 文本）按「忽略大小写」在 isCompany 联系人中查找/复用；找不到则新建一条 isCompany 联系人。
 *  - 给个人联系人回填 parentId，并把 company 文本置空（展示统一改读 parent.name）。
 *
 * 用法：
 *   npx ts-node scripts/migrate-company-relation.ts            # 仅统计，不改动
 *   npx ts-node scripts/migrate-company-relation.ts --apply    # 真正执行迁移
 */
import { config } from "dotenv";
config({ path: ".env" });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const norm = (s?: string | null): string | null =>
  s && s.trim() ? s.trim() : null;
const normKey = (s?: string | null): string | null =>
  s && s.trim() ? s.trim().toLowerCase() : null;

async function main() {
  console.log(
    APPLY ? "=== APPLY 模式：将执行公司关系迁移 ===" : "=== DRY-RUN 模式：仅统计 ===",
  );

  // 现有公司（isCompany=true）按名称索引，避免重复建公司
  const existingCompanies = await prisma.contact.findMany({
    where: { isCompany: true, isSystem: false },
    select: { id: true, name: true },
  });
  const companyByName = new Map<string, string>();
  for (const c of existingCompanies) {
    const k = normKey(c.name);
    if (k && !companyByName.has(k)) companyByName.set(k, c.id);
  }

  // 待迁移的个人联系人
  const persons = await prisma.contact.findMany({
    where: {
      isCompany: false,
      isSystem: false,
      parentId: null,
      NOT: { company: null },
    },
    select: {
      id: true,
      name: true,
      company: true,
      type: true,
    },
  });

  const plan: { personId: string; personName: string; company: string; companyId: string; created: boolean }[] = [];
  const toCreate: { name: string; type: string }[] = [];

  for (const p of persons) {
    const companyText = norm(p.company);
    if (!companyText) continue;
    const key = normKey(companyText)!;
    let companyId = companyByName.get(key);
    let created = false;
    if (!companyId) {
      companyId = `__NEW__:${key}`; // 占位，apply 阶段实际创建
      created = true;
      companyByName.set(key, companyId); // 同批次内复用
      toCreate.push({ name: companyText, type: p.type });
    }
    plan.push({
      personId: p.id,
      personName: p.name,
      company: companyText,
      companyId,
      created,
    });
  }

  const newCompanyCount = new Set(
    plan.filter((x) => x.created).map((x) => x.companyId),
  ).size;

  console.log(
    `\n统计：需迁移的个人联系人 ${plan.length} 条；将新建公司 ${newCompanyCount} 家（基于去重后的公司名）。`,
  );

  // 预览前若干条
  const preview = plan.slice(0, 20);
  for (const x of preview) {
    console.log(
      `[${x.created ? "新建公司" : "复用公司"}] 个人 ${x.personName}(${x.personId}) -> 公司「${x.company}」`,
    );
  }
  if (plan.length > preview.length) {
    console.log(`... 其余 ${plan.length - preview.length} 条省略`);
  }

  if (!APPLY) {
    console.log("\n（DRY-RUN）未做任何改动。确认无误后加 --apply 执行。");
    return;
  }

  // ============ 执行迁移 ============
  // 1) 先批量创建去重后的新公司（按 company 文本），建立 company 文本 -> id 映射
  const newCompanyByKey = new Map<string, string>();
  const distinctNew = Array.from(
    new Map(toCreate.map((c) => [normKey(c.name)!, c])).values(),
  );
  for (const c of distinctNew) {
    const created = await prisma.contact.create({
      data: {
        name: c.name,
        type: (["customer", "supplier", "user"].includes(c.type) ? c.type : "customer") as any,
        isCompany: true,
        customerType: "",
        email: undefined,
        phone: "",
        country: "",
        website: "",
      },
    });
    newCompanyByKey.set(normKey(c.name)!, created.id);
  }

  // 2) 逐条回填 parentId 并清空 company 文本
  let ok = 0;
  let failed = 0;
  const failedList: string[] = [];
  for (const x of plan) {
    const companyId =
      x.created && x.companyId.startsWith("__NEW__:")
        ? newCompanyByKey.get(normKey(x.company)!)!
        : x.companyId;
    try {
      await prisma.contact.update({
        where: { id: x.personId },
        data: { parentId: companyId, company: null },
      });
      ok++;
    } catch (e: any) {
      failed++;
      failedList.push(`${x.personId}: ${e.message?.split("\n")[0] ?? e}`);
    }
  }

  console.log("\n=== 执行完成 ===");
  console.log(`个人联系人回填成功 ${ok} 条，失败 ${failed} 条；新建公司 ${distinctNew.length} 家。`);
  if (failed) console.log("失败:", failedList);
}

main()
  .catch((e) => {
    console.error("脚本异常：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
