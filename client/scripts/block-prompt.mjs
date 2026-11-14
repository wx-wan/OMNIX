#!/usr/bin/env node
/**
 * 从公开的 /block/{slug}/preview?style=vega 取证 JSON 生成「本项目专用」组件复刻 prompt。
 *
 * 官网的 Copy Prompt 对 Pro block 有付费墙（Unlock Premium Access），本项目不依赖它：
 * 这里把公开渲染页的 DOM 规格 + 本地技术栈约束拼成一份可复用的 AI 提示词。
 *
 *   node scripts/block-prompt.mjs --spec /tmp/rea_shell01.json --slug dashboard-shell-01 --out /tmp/prompt.md
 *   node scripts/block-prompt.mjs --spec /tmp/rea_block_preview.json --key '/block/ai-chat-01/preview?style=vega' --slug ai-chat-01
 */
import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (name, fallback = undefined) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};

const specPath = arg('--spec');
if (!specPath) {
  console.error('usage: node scripts/block-prompt.mjs --spec <json> [--key <dict-key>] --slug <slug> [--style vega] [--out <file>]');
  process.exit(1);
}
const raw = JSON.parse(readFileSync(specPath, 'utf8'));
const key = arg('--key');
const src = key ? raw[key] : raw;
if (!src) {
  console.error(`key not found: ${key}`);
  process.exit(1);
}
const slug = arg('--slug', key ? key.split('/')[2] : 'unknown');
const style = arg('--style', 'vega');
const outPath = arg('--out');
const previewUrl = key && key.startsWith('http') ? key : `https://shadcndashboard.dev/block/${slug}/preview?style=${style}`;

const arr = v => (Array.isArray(v) ? v : []);
const num = (v, d = 0) => (typeof v === 'number' ? v : d);

/** 把两套取证口径归一化为统一 spec */
const leafTexts = arr(src.leafTexts ?? src.leaf)
  .map(t => String(t).replace(/\s+/g, ' ').trim())
  .filter(t => t && !/schema\.org|@font-face|__next_f|TURBOPACK|html \{ visibility|^\{|^0$/.test(t));
const cards = arr(src.cards).map((c, i) => ({
  i: c.i ?? i,
  x: c.x, y: c.y, w: c.w, h: c.h,
  text: String(c.text ?? c.title ?? c.t ?? '').replace(/\s+/g, ' ').trim(),
}));
const buttons = arr(src.buttons).map(b => String(b ?? '').replace(/\s+/g, ' ').trim());
const inputs = arr(src.inputs).map(i => (typeof i === 'string' ? i : i.placeholder ?? i.type ?? 'INPUT'));
const charts = num(src.charts ?? src.recharts);
const svgs = num(src.svgs);
const imgs = num(src.imgs);
const tables = num(src.tables);
const bodyLen = num(src.bodyLen);

const STACK = [
  'React + TypeScript + Tailwind CSS v4（项目 package.json type=module，已配置 @custom-variant / @import）',
  'UI 原子组件统一从 `@/components/ui/{card,button,table,badge,input,select}` 引入，不要自造等价物',
  '图标只用 `lucide-react`；图表只用 `recharts` + `@/components/ui/chart.tsx` 的 ChartContainer，配色走 --chart-1..5',
  'DOM 契约必须挂 `data-slot`（card/button/badge/table 等），线上有什么就挂什么',
  '主题：html 根带 `style-vega` / `.dark`；RTL 必须用 logical 属性（ps-/pe-/ms-/me-/start-/end-），不要用 left/right',
  'i18n 只翻译侧栏菜单，页面本体文案按取证硬编码英文；不要引入 t() 到页面文案',
];

const PROHIBITED = [
  '禁止新增 npm 依赖（如需能力，用现有 recharts / lucide-react / @tanstack/react-table 实现）',
  '禁止「统一框架 + 示例数据」占位：每个卡片、字段、表格行、按钮都必须来自下面的取证规格',
  '禁止随机数据 / 随机排序（会导致每次刷新 diff 漂移），所有文案与数值必须固定',
  '禁止把线上没有的文案包成叶子节点；线上不是 button 的项（如 contacts 的导航/列表）不要用 button',
  'Card 组件默认 `py-4`（16px×2）会让卡片高度多 32px；按取证高度决定是否内联 `style={{paddingTop:0,paddingBottom:0}}`',
];

const ACCEPTANCE = [
  'card 数量与每张卡的 (x,y,w,h) 与取证一致，允许 ≤2px 边框差',
  'leafTexts 文案序列 difflib.SequenceMatcher ratio ≥ 0.98（含顺序）',
  'buttons 序列逐项相等（空文本按钮保留），inputs placeholder 逐项相等',
  '表格列数 / 列宽 / 行数 / 每行单元格文案逐项相等',
  '徽标与状态色使用取证到的精确 hex，不要用 Tailwind 近似色',
  'overflow=false、无 radial-gradient 点阵残留、0 pageerror',
  'tsc 0 error + 无 shim 生产构建通过 + 52 条路由回归 bad=[] + REA 5 态矩阵对齐',
];

const md = (title, items) => `## ${title}\n${items.map((x, i) => `${i + 1}. ${x}`).join('\n')}`;

const cardTable = cards.length
  ? `| # | x | y | w | h | 文案摘要 |\n|---|---|---|---|---|---|\n` +
    cards.map(c => `| ${c.i} | ${c.x ?? '?'} | ${c.y ?? '?'} | ${c.w ?? '?'} | ${c.h ?? '?'} | ${(c.text || '—').slice(0, 90).replace(/\|/g, '\\|')} |`).join('\n')
  : '（该次取证未保存卡片几何，需重跑 `playwright-cli run-code` 抓 `[data-slot=card]` 的 getBoundingClientRect）';

const prompt = `# 任务：为 OMNIX client 逐项 1:1 复刻 UI Block \`${slug}\`

你是本项目的实现者。请新建一个**本项目自己的**组件/页面，严格复刻下面的线上公开预览，

不要复制官网源码，也不要使用其付费 Copy Prompt 内容；以下规格全部来自公开渲染页。

- 取证源：${previewUrl}
- 主题：?style=${style}（与本地默认 vega 一致，preview 的 <html> 带 style-${style}）
- 视口：1440 × 900（如无特别说明）

${md('技术栈硬约束', STACK)}

${md('禁止事项', PROHIBITED)}

## 取证规格 · 卡片几何

${cardTable}

## 取证规格 · 文案叶子序列（按 DOM 顺序，共 ${leafTexts.length} 项）

\`\`\`text
${leafTexts.map((t, i) => `${String(i).padStart(3, ' ')} ${t}`).join('\n')}
\`\`\`

## 取证规格 · 控件

- buttons（按顺序，共 ${buttons.length}）：${JSON.stringify(buttons)}
- inputs / placeholder（共 ${inputs.length}）：${JSON.stringify(inputs)}
- 表格数：${tables}；Recharts 实例：${charts}；内联 SVG：${svgs}；img：${imgs}；body 文案长度：${bodyLen}

${md('验收标准（必须逐项自检）', ACCEPTANCE)}

## 交付要求

1. 组件文件放在 \`src/components/blocks/${slug}/\` 或 \`src/views/blocks/${slug}.tsx\`，默认导出。
2. 需要路由时挂到 \`src/routes/Router.tsx\`，并把 \`src/layouts/full/vertical/sidebar/sidebaritems.ts\` 对应外链收敛为站内。
3. 输出后说明：哪些项逐项一致、哪些项有差异及原因，不要声称「完全一致」而跳过 diff。
`;

if (outPath) writeFileSync(outPath, prompt, 'utf8');
else process.stdout.write(prompt);
if (outPath) console.error(`wrote ${outPath} (${prompt.length} chars, ${leafTexts.length} leaf texts, ${cards.length} cards)`);
