/**
 * 存量外链图回填：把 products.image 与 商机明细 linesJson 里的外部图床 URL
 * 重新下载转存到本地 /uploads（与 create_lead 同款防盗链抓取逻辑），并原地替换。
 * 仅处理以 http(s):// 开头的图片；下载失败（403/超时/非图片）保留原 URL，不破坏数据。
 *
 * 运行：在 server 目录执行  npx tsx scripts/backfill-product-images.ts
 */
import { PrismaClient } from "@prisma/client";
import { writeFile, existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import { extname, join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const prisma = new PrismaClient();

async function fetchImageToLocal(url: string): Promise<string> {
  const origin = (() => {
    try {
      return new URL(url).origin + "/";
    } catch {
      return "https://www.taobao.com/";
    }
  })();
  const headerVariants: Record<string, string>[] = [
    {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: origin,
    },
    {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  ];
  let lastErr: unknown;
  for (const headers of headerVariants) {
    try {
      const res = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const type = (res.headers.get("content-type") ?? "").toLowerCase();
      if (!type.startsWith("image/")) {
        lastErr = new Error(`非图片类型：${type || "未知"}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > 5 * 1024 * 1024) {
        lastErr = new Error("超过 5MB 上限");
        continue;
      }
      const sub = type.split("/")[1]?.split(";")[0];
      let ext = extname(new URL(url).pathname).toLowerCase();
      if (!ext || ext.length > 5) ext = sub ? `.${sub === "jpeg" ? "jpg" : sub}` : ".png";
      const name = `${randomUUID()}${ext}`;
      await writeFile(join(UPLOAD_DIR, name), buf);
      return `/uploads/${name}`;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function main() {
  const products = await prisma.product.findMany({
    where: { image: { startsWith: "http" } },
    select: { id: true, image: true },
  });
  const deals = await prisma.deal.findMany({
    where: { linesJson: { not: undefined } },
    select: { id: true, linesJson: true },
  });

  // 收集所有外部图片 URL（去重）
  const urlSet = new Set<string>();
  for (const p of products) if (p.image) urlSet.add(p.image);
  const lineImages: { dealId: string; json: unknown[] }[] = [];
  for (const d of deals) {
    try {
      const arr = JSON.parse(d.linesJson as string);
      if (Array.isArray(arr)) lineImages.push({ dealId: d.id, json: arr });
    } catch {
      /* ignore malformed */
    }
  }
  for (const li of lineImages)
    for (const row of li.json as Record<string, unknown>[])
      if (row?.image && /^https?:\/\//i.test(String(row.image)))
        urlSet.add(String(row.image));

  const map = new Map<string, string>();
  let ok = 0;
  let fail = 0;
  for (const url of urlSet) {
    try {
      const local = await fetchImageToLocal(url);
      map.set(url, local);
      ok++;
      console.log(`OK   ${url} -> ${local}`);
    } catch (e) {
      fail++;
      console.warn(`FAIL ${url} ${String(e)}`);
    }
  }

  // 写回 products
  for (const p of products) {
    const local = p.image ? map.get(p.image) : undefined;
    if (local)
      await prisma.product.update({ where: { id: p.id }, data: { image: local } });
  }
  // 写回 deal 明细
  for (const li of lineImages) {
    let changed = false;
    for (const row of li.json as Record<string, unknown>[]) {
      if (row?.image && map.has(String(row.image))) {
        row.image = map.get(String(row.image));
        changed = true;
      }
    }
    if (changed)
      await prisma.deal.update({
        where: { id: li.dealId },
        data: { linesJson: JSON.stringify(li.json) },
      });
  }

  console.log(
    `done: 待处理 ${urlSet.size}，本地化成功 ${ok}，失败 ${fail}（失败项保留原 URL）`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
