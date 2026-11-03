/**
 * 一次性清理脚本：按既定去重规则合并联系人库 / 产品库的重复记录。
 *
 * 规则（与建单去重口径一致）：
 *  - 联系人：同邮箱（忽略大小写）或 同客户名（忽略大小写）视为同一人 → 合并。
 *  - 产品：同描述（忽略大小写）视为同一产品 → 合并；空描述与「未命名产品」占位不合并。
 *
 * 合并策略：每组保留「信息最完整」的一条（字段非空数最多，平局取最早创建），
 * 其余记录的商机/报价/明细引用改挂保留记录后删除；并把被删记录里保留记录缺失的字段补回。
 *
 * 用法：
 *   npx ts-node scripts/cleanup-duplicates.ts            # 仅统计，不改动
 *   npx ts-node scripts/cleanup-duplicates.ts --apply    # 真正执行清理
 */
import { config } from "dotenv";
config({ path: ".env" });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const norm = (s?: string | null): string | null =>
  s && s.trim() ? s.trim().toLowerCase() : null;

// 计非空字段数，用于挑选“信息最完整”的保留记录
const COMPLETENESS_KEYS_C = [
  "name",
  "email",
  "phone",
  "company",
  "country",
  "website",
  "customerType",
] as const;
const scoreContact = (c: any) =>
  COMPLETENESS_KEYS_C.filter((k) => c[k] != null && String(c[k]).trim() !== "")
    .length;

const COMPLETENESS_KEYS_P = [
  "description",
  "unit",
  "costPrice",
  "tax",
  "image",
  "category",
  "audience",
  "process",
  "mode",
] as const;
const scoreProduct = (p: any) =>
  COMPLETENESS_KEYS_P.filter((k) => p[k] != null && String(p[k]).trim() !== "")
    .length;

async function main() {
  console.log(APPLY ? "=== APPLY 模式：将执行清理 ===" : "=== DRY-RUN 模式：仅统计 ===");

  // ============ 联系人去重 ============
  const contacts = await prisma.contact.findMany({
    where: { isSystem: false },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      country: true,
      website: true,
      customerType: true,
      createdAt: true,
    },
  });

  // 并查集：按 email 与 name 两种等价关系连边
  const parent: Record<string, string> = {};
  const find = (x: string): string => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  contacts.forEach((c) => (parent[c.id] = c.id));

  const byEmail: Record<string, string[]> = {};
  const byName: Record<string, string[]> = {};
  for (const c of contacts) {
    const e = norm(c.email);
    const n = norm(c.name);
    if (e) (byEmail[e] ||= []).push(c.id);
    if (n) (byName[n] ||= []).push(c.id);
  }
  const linkGroup = (group: string[]) => {
    for (let i = 1; i < group.length; i++) union(group[0], group[i]);
  };
  Object.values(byEmail).forEach(linkGroup);
  Object.values(byName).forEach(linkGroup);

  // 组件归类
  const comps: Record<string, string[]> = {};
  for (const c of contacts) {
    const r = find(c.id);
    (comps[r] ||= []).push(c.id);
  }
  const contactMap = new Map(contacts.map((c) => [c.id, c]));
  const contactDupGroups = Object.values(comps).filter((g) => g.length > 1);

  let contactMerged = 0;
  const contactPlan: { keep: string; remove: string[] }[] = [];
  for (const group of contactDupGroups) {
    const members = group.map((id) => contactMap.get(id)!);
    // 保留：完整度最高，平局取最早
    const keep = members.reduce((best, c) =>
      scoreContact(c) > scoreContact(best) ||
      (scoreContact(c) === scoreContact(best) &&
        new Date(c.createdAt) < new Date(best.createdAt))
        ? c
        : best,
    );
    const remove = members.filter((c) => c.id !== keep.id).map((c) => c.id);
    contactMerged += remove.length;
    contactPlan.push({ keep: keep.id, remove });
    console.log(
      `[联系人] 合并组: 保留 ${keep.id}(${keep.name}/${keep.email ?? "无邮箱"}) <= 删除 ${remove.length} 条 | 姓名组=${norm(keep.name)} 邮箱组=${norm(keep.email) ?? "-"}`,
    );
  }

  // ============ 产品去重 ============
  const products = await prisma.product.findMany({
    select: {
      id: true,
      description: true,
      unit: true,
      costPrice: true,
      tax: true,
      image: true,
      category: true,
      audience: true,
      process: true,
      mode: true,
      parentId: true,
      createdAt: true,
    },
  });

  const byDesc: Record<string, string[]> = {};
  for (const p of products) {
    const d = norm(p.description);
    if (!d || d === "未命名产品") continue; // 占位/空描述不参与合并
    (byDesc[d] ||= []).push(p.id);
  }
  const productDupGroups = Object.values(byDesc).filter((g) => g.length > 1);
  const productMap = new Map(products.map((p) => [p.id, p]));
  let productMerged = 0;
  const productPlan: { keep: string; remove: string[]; oldToNew: Record<string, string> }[] = [];
  const oldProductToNew = new Map<string, string>();
  for (const group of productDupGroups) {
    const members = group.map((id) => productMap.get(id)!);
    const keep = members.reduce((best, p) =>
      scoreProduct(p) > scoreProduct(best) ||
      (scoreProduct(p) === scoreProduct(best) &&
        new Date(p.createdAt) < new Date(best.createdAt))
        ? p
        : best,
    );
    const remove = members.filter((p) => p.id !== keep.id).map((p) => p.id);
    remove.forEach((id) => oldProductToNew.set(id, keep.id));
    productMerged += remove.length;
    productPlan.push({ keep: keep.id, remove, oldToNew: Object.fromEntries(oldProductToNew) });
    console.log(
      `[产品] 合并组: 保留 ${keep.id}(${keep.description}) <= 删除 ${remove.length} 条`,
    );
  }

  console.log(
    `\n统计：联系人将合并删除 ${contactMerged} 条（${contactDupGroups.length} 组）；产品将合并删除 ${productMerged} 条（${productDupGroups.length} 组）`,
  );

  if (!APPLY) {
    console.log("\n（DRY-RUN）未做任何改动。确认无误后加 --apply 执行。");
    return;
  }

  // ============ 执行清理 ============
  let failedContacts: string[] = [];
  let failedProducts: string[] = [];

  // 联系人：补字段 → 改挂引用 → 删除
  for (const { keep, remove } of contactPlan) {
    const keepRow = (await prisma.contact.findUnique({ where: { id: keep } }))!;
    const patch: any = {};
    for (const k of COMPLETENESS_KEYS_C) {
      if (keepRow[k] == null || String(keepRow[k]).trim() === "") {
        for (const rid of remove) {
          const r = contactMap.get(rid)!;
          if (r[k] != null && String(r[k]).trim() !== "") {
            patch[k] = r[k];
            break;
          }
        }
      }
    }
    if (Object.keys(patch).length) {
      await prisma.contact.update({ where: { id: keep }, data: patch });
    }
    for (const rid of remove) {
      await prisma.deal.updateMany({ where: { contactId: rid }, data: { contactId: keep } });
      await prisma.quotation.updateMany({ where: { contactId: rid }, data: { contactId: keep } });
      try {
        await prisma.contact.delete({ where: { id: rid } });
      } catch (e: any) {
        failedContacts.push(`${rid}: ${e.message?.split("\n")[0] ?? e}`);
      }
    }
  }

  // 产品：改挂引用（deal.productId / linesJson / 变体 parentId）→ 删除
  // 先收集全部 old->new 映射
  const allOldToNew: Record<string, string> = {};
  productPlan.forEach((p) => Object.assign(allOldToNew, p.oldToNew));

  // 1) 变体 parentId 重指
  for (const [oldId, newId] of Object.entries(allOldToNew)) {
    await prisma.product.updateMany({ where: { parentId: oldId }, data: { parentId: newId } });
  }
  // 2) 商机 productId 单值 + linesJson 内 productId
  const deals = await prisma.deal.findMany({
    where: { OR: [{ productId: { in: Object.keys(allOldToNew) } }, { linesJson: { not: null } }] },
    select: { id: true, productId: true, linesJson: true },
  });
  for (const d of deals) {
    let changed = false;
    const data: any = {};
    if (d.productId && allOldToNew[d.productId]) {
      data.productId = allOldToNew[d.productId];
      changed = true;
    }
    if (d.linesJson) {
      try {
        const lines = JSON.parse(d.linesJson);
        if (Array.isArray(lines)) {
          for (const ln of lines) {
            if (ln && ln.productId && allOldToNew[ln.productId]) {
              ln.productId = allOldToNew[ln.productId];
              changed = true;
            }
          }
          if (changed) data.linesJson = JSON.stringify(lines);
        }
      } catch {
        /* 忽略损坏 JSON */
      }
    }
    if (changed) await prisma.deal.update({ where: { id: d.id }, data });
  }
  // 3) 删除重复产品
  for (const { remove } of productPlan) {
    for (const rid of remove) {
      try {
        await prisma.product.delete({ where: { id: rid } });
      } catch (e: any) {
        failedProducts.push(`${rid}: ${e.message?.split("\n")[0] ?? e}`);
      }
    }
  }

  console.log("\n=== 执行完成 ===");
  console.log(`联系人删除成功 ${contactMerged - failedContacts.length} 条，失败 ${failedContacts.length} 条`);
  if (failedContacts.length) console.log("联系人失败:", failedContacts);
  console.log(`产品删除成功 ${productMerged - failedProducts.length} 条，失败 ${failedProducts.length} 条`);
  if (failedProducts.length) console.log("产品失败:", failedProducts);
}

main()
  .catch((e) => {
    console.error("脚本异常：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
