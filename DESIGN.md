---
name: Omnix Design System
description: 1:1 复刻 shadcndashboard / PMS Workspace 参考 demo 的运营型后台界面规范（唯一权威）
colors:
  # 取自 client/src/css/styles/theme-tokens.css（线上 PMS CSS 的 lab() 编译产物，逐值搬运）
  ink: "lab(1.88815% .256047 -5.3124)"
  paper: "lab(100% 0 0)"
  cloud: "lab(96.16% -.0797212 -1.09795)"
  hairline: "lab(91.5774% -.154167 -2.19253)"
  muted-ink: "lab(35.6617% -1.46081 -9.53184)"
  danger: "lab(55.7818% 65.601 40.7834)"
  # --brand 在项目里本身就是 hex（sky-500），不转换为 lab 以免分裂事实来源
  brand-sky: "#0ea5e9"
  # 侧栏表面；线上 --sidebar。选中底复用 cloud（线上 --sidebar-accent 同值），字色复用 ink
  sidebar-surface: "lab(98.26% 0 0)"
typography:
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "20px"
    fontWeight: 600
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  nav-label:
    fontFamily: "Geist, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  "2xl": "18px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "32px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "32px"
  card-surface:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  nav-item:
    backgroundColor: "{colors.sidebar-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-label}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "{colors.cloud}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-label}"
    rounded: "{rounded.pill}"
    height: "36px"
---

# Design System: Omnix

## Overview

**Creative North Star: "The Reference Mirror（参考镜像）"**

Omnix 是线上参考 demo 的 1:1 复刻，不是一次视觉再创作。视觉权威来自取证：官网 `shadcndashboard.dev` 的 block preview、PMS Workspace 线上整页截图/DOM，以及本地免费版基准 `:5180`；工程内已经复刻完成的代码是这套权威的落地形态。界面属 **Operate** 模式：可扫读、密度稳定、状态明确，品牌只体现在精确细节里，不靠装饰表达个性。

**本文件是后续所有前端改动的唯一规范。** 旧的 `design-system/MASTER.md` 已废弃删除。通用设计技能给出的紫色主色（#7C3AED）、Fira 字体、Portfolio Grid 版式，以及技能附带的另一项目约定（antd 组件、#1677ff 主色、InfoCircleOutlined 提示）**都不适用于本项目**：Omnix 是 `base-nova` + Tailwind v4 + Base UI + Lucide，色板是 PMS 线上 CSS 的 `lab()` 编译产物。任何与取证冲突的建议，以本文件为准。

**Key Characteristics:**

- 单一镜像：线上 demo 是唯一事实来源，功能扩展不得破坏 1:1 视觉基线。
- 组件复用：官方 shadcn 组件优先，项目内 1:1 复刻件次之，禁止手搓等价物。
- 取证驱动：字号、间距、状态色、列数、文案都要能对上取证，不靠「更好看」判断。
- 双语与明暗：中英词条成对，明/暗两套都要保证对比度与边框可见。
- 如实登记：线上暂停或几何受限时用归档取证，并把差异写成已知项，不虚报对齐。

### 参考 demo 与取证源

- 官网可访问契约：`https://shadcndashboard.dev/block/{slug}/preview?style=vega`（完整渲染组件 DOM），分类页 22 类 / 209 blocks。
- PMS Workspace 线上整页截图：概览 / 问题 / 任务 / 迭代 / 成员 / 文件 / 互动七张（2026-11-15 用户提供）。
- 线上 CSS 逐值搬运：`client/src/css/styles/theme-tokens.css`、`client/src/css/globals.css`。
- 本地代码即落地权威：`client/src/components/ui/*`、`client/src/views/workspace/pms.tsx`、`client/src/views/apps/shared.tsx`。

### 执行约定（每次改动都走）

1. 先核验工程内既有组件的 props / 结构 / className，再决定复用哪一个。
2. 与参考 demo 逐项比对，只改有取证差异的项，并在交付里说明改了哪一项。
3. 不擅自改动既有组件源码、字号、间距、配色——这是用户反复强调的硬约束。
4. 验收：`npx tsc --noEmit` 与 `npm run lint` 0 error；浏览器逐项比对卡片 / 字段 / 按钮 / 表格列 / 状态色 / 文案 / 几何；覆盖中英、明暗、boxed/full 与多视口；0 pageerror。

### 当前基线（2026-11-15，如实登记）

- 侧栏 APPS 分组暂时隐藏（数据保留，后续再盘），设置 / 使用文档保留。
- 项目详情保留右栏 `Details` 与迭代 tab 的九阶段卡片，均为既有 1:1 契约，不因单张截图裁剪而删除。
- 详情表格的操作入口、七个 tab 的新建入口均改为 hover 浮现，静态列数与顶部结构与 demo 一致，功能不丢失。
- 互动左列时分：快照 `timestamp` 是 `RELATIVE_DAYS_*`，没有时分粒度；按线上取证复刻固定展示值，ISO 时间戳读真实时分，不生成随机假时间。
- **已知差异**：参考 demo 的 tab 栏为全宽一行、表格所有列一屏可见；本地因保留右栏 `Details`，主区宽度约为线上一半，tab 栏折为两行、表格末列需横向滚动。两者同源，不以缩小字号、改 padding 或删右栏来补偿，待后续统一布局决策。
- **导航审计（2026-11-15，pms-audit）**：线上为 56px rail + 240px panel 两级、单组切换、底部插画；本地仍是单级通用 shadcn 侧栏（`FullLogo + V.1.0` header、Home / Workspace 两组平铺、无插画）。按用户 2026-11-15 决策**保持单级侧栏，不实现 rail + panel 两级结构**（线上结构仅作取证事实记录），并**不展示 `PMS` 副标题**；两者均属有意偏离，不回补。
- **导航样式收口（2026-11-15）**：按线上取证收敛三项 —— 菜单 `text-sm` / `font-medium`（14px / 500）、图标 `h-4 w-4`（16px）、选中底 `bg-sidebar-accent`（`{colors.cloud}`）。`bg-sidebar-accent` 是项目内 cloud 的既有工具类（`--color-sidebar-accent` → `--sidebar-accent`，亮暗色值均与 `--muted` 一致），与线上同名 token 对齐，未新增 token、未改结构/间距/配色体系。
- **分组标题保留原生样式（2026-11-15 用户决策）**：「首页」/「工作区」等分组标题恢复最初的灰色小号标签 `text-xs uppercase font-medium text-muted-foreground mb-1`，含折叠态 `...` 省略逻辑；**不采用**线上面板的 16px / 600 大标题。线上 16px / 600 仅作取证事实保留，本地此项属有意偏离，后续不要再按审计结论改成大标题。
- **全局底部栏已移除（2026-11-15 用户决策）**：`FullLayout` 不再挂载 `shared/footer/Footer`，`© 2026 by shadcndashboard, creating a better web for you.` 与 About Us / Blog / License 链接全站不展示；组件文件已删除（可由 git 恢复）。线上取证里的 footer 计数不再作为本地验收项。
- **设置页 1:1 复刻（2026-11-15）**：按 `pms-audit/dom/23-settings-*.{html,json}` 与 `screenshots/23-settings-*.png` 落地 5 个子页（general / members / billing / integrations / api-keys），公共外壳为 `Settings` + `Manage your workspace` + 192px 左侧导航 + `flex-1` 内容区。卡片、表格、字段、控件、按钮变体一律复用 `components/ui/*`（本地默认 class 与线上取证逐字同源），不手写等价结构。文案以各页 `leaves` 有序序列为准；日期字面量（`2025年1月1日`、`2026/9/1`、`2026年1月15日`、`2 days ago`）与密钥掩码 `pms_a1b2••••••••k1l2` 按取证原样保留。设置入口由侧栏底部用户菜单的 `Setting` 与顶栏 `Account Settings` 提供（两者原为模板外链 `.../theme-pages/faq` 与占位 `/`，已收口到站内 `/settings/general`）；设置页内部的 192px 导航已含 General，**不再额外新增侧栏 Support / Help 分组**（2026-11-15 用户决策：与设置页内部导航重复，已删除），仍保持单级侧栏。`Buy Now` 外链与 rail / panel 两级导航不复刻。
- **个人设置页 1:1 复刻 + 头像面板收口（2026-11-15）**：按 `pms-audit/dom/11-profile.*` 新建 `/profile`（6 张卡 / 50 行 leaves / 13 个输入 / 4 个 switch / 2 个危险操作），卡片、Field、Switch、Badge、Avatar 全部复用 `components/ui/*`；`Reset` 与 `Delete account` 弹窗文案复用页面既有行标题与描述，不臆造取证未取到的弹层文本。右上角头像面板：菜单精简为 Home / `Personal Settings`（→ `/profile`）/ `Account Settings`（→ `/settings/general`），删除模板的 Invoice / Subscription 两项；底部推广卡片**只保留插画图案**（`sidebarbuynow.svg`）与退出按钮，删除全部文案（2026-11-15 用户决策）；`Manage your workspace` 词条仍由设置页外壳副标题使用，不作删除。线上 `46-user-menu` 的 `My Profile` / `Settings` / `Signout` 下拉形态仅作取证事实，本地仍沿用工程的 Sheet 面板，属有意偏离。
- **项目详情初始化空态（2026-11-15 用户提供六张 `/projects/1947405371764` 截图）**：`views/workspace/projects/detail.tsx` 原本 7 个 tab 全无空态分支、默认 `p1` 又是满数据，线上「新建项目」样式在本地不可见。现补齐统一 `EmptyState`（浅灰 lucide 图标 20px + 12px 说明 + `py-12` 居中留白）：Overview 三处 `Nothing needs attention right now` / `No milestones yet` / `No tasks due soon`，Issues / Tasks / Files / Activity 各一处 `No issues in this project` / `No tasks in this project` / `No files uploaded yet` / `No activity yet`。线上空态不是 shadcn Empty 组件（`data-slot=empty` 计数 0），故不引入新组件库，也不改既有卡片/表格几何。Members 按截图**只保留表头**、无空态文案（成员数为 0 时自然呈现；现有快照 11 个项目均带成员，故 `p9` 仍有 2 行数据）；Sprints 未给截图，九阶段卡片维持既有 1:1 契约。`p7/p9/p10/p11` 本就是无关联数据的空项目，访问即可见初始化态；默认 `p1` 满数据态不改动、不回归。四条 `No … in this project` 文案仅来自用户截图，`pms-audit` 未落盘（其 `20-project-p9.json` 只记 Overview 三条），取证来源如实登记，不臆造。

## Colors

冷蓝调近黑 + 白纸 + 中性灰构成主体，识别度来自 PMS 色板而非饱和品牌色；状态色只有一套语义。

### Primary

- **Ink（近黑冷蓝）**：正文、标题、主按钮、激活态底色。hex 回退 `#030712`，暗色下与前景互换。
- **Brand Sky（品牌蓝 #0ea5e9）**：`--brand`，仅用于品牌/链接类点缀，暗色为 `#38bdf8`；不是全站主按钮色。

### Secondary

- **Cloud（浅灰蓝）**：`muted` / `secondary` / `accent` 底色，hex 回退 `#f3f4f6`。
- **Hairline（细线灰）**：边框、分隔线、popover 边界，hex 回退 `#e5e7eb`。

### Tertiary

- **Chart 五色**：红 / 青 / 蓝 / 黄 / 橙（`--chart-1..5`，`theme-tokens.css` 的 `lab()` 值）。用于图表系列，不与状态色混用。

### Neutral

- **Paper（白）**：页面、卡片、popover 底色，hex 回退 `#fff`。
- **Muted Ink（次要文字）**：元信息、表头、占位符，hex 回退 `#4b5563`。
- **Danger（危险红）**：删除、错误、逾期告警，`--destructive`。

### 状态语义色（组件内使用，来自线上取证）

进行中 `blue-500`、完成 `teal-400`、逾期 / 审核 `orange-400`、危险 `red-500` / `destructive`、未开始 `slate-200` / `muted`。徽标是 `bg-*/10 + text-*` 的浅底胶囊，状态点是同语义实色方块。

**The One Palette Rule.** 不得引入第二套品牌色或第二套状态色。紫色 #7C3AED、Fira、antd 蓝 #1677ff 及其 token 体系一律禁止。

**The Semantic Status Rule.** 同一状态在徽标、状态点、时间线圆点上必须使用同一语义色；禁止为「更醒目」私自换色。

## Typography

**Display / Body Font:** Geist（`--font-geist`，sans-serif 回退）；**Mono:** Geist Mono（`--font-geist-mono`）。`components.json` 为 `style: base-nova`、`baseColor: neutral`、`iconLibrary: lucide`。

**Character:** 中性、紧凑、无衬线的运营型字阶；层级靠字重与灰度区分，不靠字号跳跃。

### Hierarchy

- **Title** (600, 20px)：详情页项目名、页面主标题（`text-xl`）。
- **Body** (400, 14px)：表格主体、卡片标题、按钮文案（`text-sm`）。
- **Label** (500, 12px)：表头、元信息、徽标、详情行标签（`text-xs`）。
- **Input** (400, 16px，`md` 断点降 14px)：`client/src/components/ui/input.tsx` 的既有约定，不要统一改成 14px。

**The No Resize Rule.** 不得为了「更醒目」擅自放大或缩小字号、行高、内边距。历史教训：迭代卡片曾被放大到 20px 标题 / 24px 状态点，随后按线上整页截图收敛回 14px / 14px 方块。任何调整必须附取证并说明差异项。

**The Layout-Does-The-Explaining Rule.** 不用文字复述布局已表达的信息：`DialogDescription` 不复述标题，不渲染「选填 / 必填 / 已跳过」等次要标签，不写复述 Label 的 helper text；placeholder 用格式示例或产品口径引导语（如「为您的新需求取个项目名称」）。

## Layout

外壳由 `FullLayout` 承载，唯一侧栏 + 顶栏，内容区独立滚动。页面根为 `flex min-w-0 flex-1 flex-col gap-4 rounded-xl bg-background p-6`（`PmsPage`）。

- **容器契约**（`css/styles/layout-contract.css`）：boxed 为 `max-width: min(1367px, 100% - 2 * 48px)`，full 撑满 `w-full`，horizontal 时侧栏让位、顶栏两行贴边。禁止用 `relative` / `left` / 负边距做几何补偿；`overflow-hidden` 的父容器要用 `getBoundingClientRect().right` 对比验收裁切。
- **详情页**：主区 + 右栏 `Details`。右栏固定三段——`Details` 头（`border-b px-5 py-4`）、Progress 专用区（`space-y-2 border-b px-5 py-4`，只放进度）、标准详情行（`flex items-center justify-between gap-3 px-5 py-3`，`divide-y divide-border`）。新增字段只放进对应既有区块，行几何与相邻行一致。
- **项目列表**：`PmsCard` 为 `min-h-96`、14px 圆角、1px 边框、toolbar `p-3.5`；`PmsHeader` 表头 `h-10`、`border-b`、`px-3 pl-13`；行 `px-3 py-3`；窄容器下表格允许 `min-w-3xl` 横向滚动。
- **迭代区**：`grid gap-4 p-5 md:grid-cols-2`；卡片 14px 圆角、`p-4`。
- **视图状态**走查询参数（`?view=` / `?tab=`），tab 栏是带图标的 pill 分段控件，不改成官方 Tabs。

**The Layout Contract Rule.** 布局几何以 `FullLayout.tsx` + `layout-contract.css` 为准，boxed / full × 多视口都要验收；局部差异先登记，不用补偿样式掩盖。

## Elevation & Depth

系统以平面为主：靠 1px 细线边框与 `muted` / `cloud`  tonal layering 表达层次，不靠大面积投影。官方 `Card` 用 `ring-1 ring-foreground/10`，`PmsCard` 用 `border border-border`，两者都不叠加强阴影。

### Shadow Vocabulary（仅在这些场景使用）

- **sm** (`0 0.125rem 0.25rem rgba(0,0,0,0.075)`)：轻微抬升。
- **md** (`0 1px 4px rgba(133,146,173,0.2)`)：浮层、下拉。
- **lg** (`0 1rem 3rem rgba(0,0,0,0.175)`)：模态、大浮层。
- **btn-shadow** (`0 9px 17.5px rgba(0,0,0,0.05)`)：按钮专用。

**The Flat-By-Default Rule.** 静止状态一律平面；阴影只在浮层、hover、focus 等状态出现，且不得造成布局位移。弹窗内不再套一层带边框圆角卡片（禁止「窗中窗」）。

## Shapes

圆角阶梯由 `--radius: .625rem`（10px）派生：sm 6px、md 8px、lg 10px、xl 14px、2xl 18px。边框统一 1px `hairline`。

- 卡片 / 页面容器：14px（`rounded-xl`）；按钮 / 输入框：10px（`rounded-lg`）；徽标：`rounded-full`；状态点：14px 方块配 4px 圆角。
- 分段控件：14px 圆角容器 + 内部圆角 pill；选中态白底，未选中透明。
- 图标统一 Lucide SVG（同层级固定尺寸：表格约 14px，卡片 12–14px，导航 16px），**禁止 emoji 作图标**。
- 表单字段标签用 `FieldLabel` 四态：必填加粗、校验失败 destructive、聚焦主色、只读 muted；**禁止红色星号**，禁止在表单里重复实现这套判断。

## Components

### Buttons

紧凑、克制，hover 只换底色。变体 `default / outline / secondary / ghost / destructive / link`；尺寸 xs 24px、sm 28px、default 32px、lg 36px、icon 32px；字号 14px / 500；圆角 10px；`focus-visible` 用 `ring-3 ring-ring/50`，`disabled` 半透明且禁用指针。

### Cards / Containers

14px 圆角、白底、1px 细边框或 `ring-1`。官方 `Card` 默认 `py-4`、`gap-4`、`text-sm`；`PmsCard` 默认 `py-0`，需要紧凑时用 `className` 覆盖，不改组件源码。

### Inputs / Fields

`Input` 为 32px 高、10px 圆角、`w-full`、`text-base`（md 起 14px）、placeholder 用 `muted-ink`；聚焦时边框 + `ring-3`。`Select` / `Textarea` 沿用同一尺寸基线。日期用 `DatePicker`（Popover + Calendar），不用原生 `input[type=date]`；下拉用工程内 `SelectField`，不在页面里直接用官方 `Select` / `SelectTrigger`。

### Tables

`PmsHeader` / `PmsRow` 为既有 1:1 件：表头 12px / 500，行 14px，`py-3`，`border-b` 分隔；头像 + 姓名组合固定尺寸。参考 demo 的列数即为目标列数，操作入口用 `group-hover/row` 在行内浮现，静态不新增「Actions」列。行末「点点点」菜单用 `DropdownMenu`（含 Sub / CheckboxItem / Separator / destructive 项），勾选标记在右侧。

### Status Chips

`rounded-full` 浅底胶囊，`text-xs` / 500，颜色按「状态语义色」章节。选择项、优先级、阶段徽标都用这一形态，禁止另一套内联色。

### Dropdown / Dialog / Confirm

基于 Base UI：`MenuGroupLabel` 必须包在 `MenuGroup` 内，否则运行时抛 `MenuGroupContext is missing`；`PopoverTrigger` 用 `render={<Button/>}` 复用同一个 button，避免嵌套 button 的 hydration 错误。二次确认统一 `ConfirmDialog`，禁止原生 `confirm()`。

### Navigation

**取证源**（2026-11-14 抓取，1280px 视口）：`pms-audit/dom/02-projects.html` 渲染后 DOM、`pms-audit/raw/assets/chunks/0q3nawgi9mjby.css` 线上 CSS 变量、`pms-audit/screenshots/30-nav-home.png` / `30-nav-workspace.png`、`pms-audit/dom/30-nav-*.raw.txt`。线上是 **rail + panel 两级侧栏**，不是单级菜单树。

- **Rail**（`<nav aria-label="Sections">`）：宽 56px（`w-14`），`rounded-xl` + 1px `hairline` 边框、`bg-sidebar`，`px-1.5 py-3`、`gap-1.5`。顶部 `P` 圆标 36px（`size-9`、线上硬编码 `#4268f0`、白字 `text-lg font-bold`）；下接 Home / Workspace / Teams / Support 四个 40px（`size-10`）`rounded-full` 图标按钮，图标 16px、iconify solar 线性 `stroke-[2.1]`，纵向间隔 46px；底部独立 `Customize navigation`。分组按钮 hover 为 `bg-primary/10` + `text-primary`。
- **Panel**（`<aside>`）：宽 240px（`min-w-60`），`rounded-xl` + 1px 边框、`bg-sidebar` = `{colors.sidebar-surface}`。标题区 `px-4 pt-4 pb-2`、`grid leading-tight`：分组名 `text-base font-semibold`（16px / 600），其下 12px `text-muted-foreground` 的 `PMS` 副标题。菜单区 `px-3 pb-3`，`sidebar-menu` 为 `gap-0`（项间无额外间距），底部固定 240×246 的 `sidebar-boy.webp` 插画。
- **菜单项**（`data-slot="sidebar-menu-button"`）：`rounded-full` 胶囊、`h-9`（36px）、`px-3 py-2`、`gap-2`、`text-sm font-medium`（14px / 500，行高 20px）、图标 `[&_svg]:size-4`（16px，与 Shapes 章节一致）、`transition-all duration-200`、`focus-visible:ring-2`。
- **状态**：默认透明底 + `ink` 字；hover `bg-sidebar-accent`（`{colors.cloud}`）+ `hover:translate-x-0.5`（右移 2px）；`active:scale-[0.97]`；选中 `data-active` 为 `bg-sidebar-accent` + `text-sidebar-accent-foreground`（`{colors.ink}`），**字重仍是 500，不靠加粗表达选中**。
- **折叠态**（`data-collapsible=icon`）：菜单按钮 `size-8!`、`flex-col`、`gap-1`、`px-1! py-2!`，图标放大到 `size-5`（20px）。
- **分组切换**：rail 一次只激活一个分组，panel 只显示该组菜单（Home = Dashboard / Inbox / Chat；Workspace = Projects / Issues / Tasks / Sprints / Calendar / Team），不把四组平铺在同一侧栏。

**The Nav State Rule.** 选中只换底色（`cloud` 胶囊），不改字号、不改字重、不换文字颜色层级；hover 只做 2px 位移与同色底。禁止用放大、加粗或高饱和色表示当前位置。

本地约束：菜单数据源 `sidebaritems.ts`，名称走 i18n，APPS 分组隐藏但数据保留；没有 `path` 的项点击提示「暂未开放」。与取证的有意偏离及已收口项见「当前基线」。

### Signature — 迭代卡片（2026-11-15 线上整页截图口径）

第一行名称（14px / 600），第二行起止日期（12px），第三行阶段描述（12px）；分隔线下为状态点（14px 圆角方块，**按真实子任务数渲染，没有就 0 个**）与右侧 `N/M 完成 · X%`（12px，数字加粗）。徽标右上、hover 时隐藏并改为编辑 / 删除图标。卡片可原生拖拽排序，顺序与隐藏项持久化到 `stageViews` overlay。

### i18n

中英词条成对维护在 `client/src/i18n/resources.ts`，英文为源语言；中文只收实际使用的文案，不留孤儿串。

## Do's and Don'ts

### Do:

- **Do** 改动前核验工程内既有组件的 props / 结构 / className，优先复用官方 shadcn 与 `pms.tsx` / `shared.tsx` 的 1:1 件。
- **Do** 用 `className` 覆盖尺寸/配色差异，用 `cn()` 合并，保留组件默认行为。
- **Do** 按取证沿用字号、间距、圆角、状态色；新增字段放进既有对应区块，几何与相邻行一致。
- **Do** 中英词条成对；所有可点击元素 `cursor-pointer`；hover 用颜色/透明度过渡，不造成布局位移。
- **Do** 验收 `tsc` / `lint` 0 error、浏览器逐项 diff、0 pageerror，并覆盖 boxed/full 与多视口。
- **Do** 线上站点暂停时用归档截图 / 官网 preview 继续取证，并如实登记 `needs_reverify`。

### Don't:

- **Don't** 擅自改动既有组件源码、字号、间距、配色或引入第二套状态色——用户已反复强调。
- **Don't** 手搓官方组件的等价物，或新增 npm 依赖；图标禁用 emoji。
- **Don't** 用 `relative` / `left` / 负边距做几何补偿，也不要用缩小字号来掩盖容器宽度差异。
- **Don't** 臆造数据、文案、字段或日期；没有取证时留空 / 占位并说明来源链路。
- **Don't** 绕过付费墙或伪造身份；Copy Prompt / Show Code 的 Premium 拦截不尝试突破。
- **Don't** 用文字复述布局已表达的信息，不渲染次要状态标签，不写复述 Label 的 helper text。
- **Don't** 使用原生 `confirm()`、红色必填星号、原生 `input[type=date]`，或把 `MenuGroupLabel` 放在 `MenuGroup` 外。
- **Don't** 套用通用技能建议（紫色 / Fira / Portfolio Grid）或另一项目的 antd / #1677ff 约定。

## 认证 / 登录注册（2026-11-15）

**取证源**：`pms-audit/dom/60-login.json`、`60-register.json`、`pms-audit/raw/page-login.html`、`page-register.html`、`pms-audit/screenshots/00-login.png`、`AUDIT.md`（线上访问 `/projects` 重定向 `/login`；Demo credentials 点击填 `bob@pms.com` / `demo`）。

- 页面：`client/src/views/auth/pms/{shared,login,register}.tsx`，逐项复刻线上 DOM——背景 section（`login-5.webp`，本地静态资源）、`max-w-md rounded-3xl` 卡片、`P` 蓝色圆标 + PMS、CardHeader / FieldGroup / Field / FieldSeparator / 两个第三方按钮 / Demo 卡。卡片几何按线上 448×758（登录）、448×694（注册）。
- 背景图与 Google / Github 图标改为本地 `client/src/assets/images/`，不依赖线上外链；文案全部走 `t()`，英文为源语言，取证时 1:1 一致。
- 真实认证：`client/src/api/auth.ts` + `context/AuthContext.tsx` 调 `/api/auth/{me,login,register,logout}`；后端是 NestJS + `express-session` + `connect-pg-simple` + bcrypt，cookie `connect.sid`，无 JWT。Vite `/api` 反代去掉前缀，**不要加 `cookieDomainRewrite`**。
- 路由：`/login`、`/register` 用 BlankLayout；旧模板地址 `/auth/auth2/login|register` 重定向到新页。`App.tsx` 挂 `AuthProvider` 与 `<Toaster />`（认证错误与第三方占位提示）。
- 登录墙：`routes/ProtectedRoute.tsx` 只包住 PMS 业务路由（Inbox / Projects / Issues / Tasks / Sprints / Calendar / Team / 需求九阶段 / Settings / Profile），模板 dashboards / apps / tables 复刻页保持开放以便逐页取证对比。未登录带 `state.from` 跳 `/login`，登录成功回到原目标页。后端不可达时降级为访客放行，避免纯 UI 演示被挡。
- 「Remember this device」按线上默认勾选，实现为本机记住邮箱（`localStorage`）；会话有效期仍由后端控制。`Forgot password?` 与 Google / Github 按钮沿用线上占位语义，第三方点击给出 toast 提示。
- 演示账号：`server/prisma/seed.ts` 幂等 upsert `bob@pms.com / demo`；已有 `admin@omnix.dev / admin123`。头像面板 `Log Out` 接真实 `/api/auth/logout` 后回 `/login`，不再跳模板登录页。

## 项目品牌改名 Omnix（2026-11-15）

用户要求「项目名修改为 Omnix，全局审计并替换」。原则：**改产品显示名，不改事实与凭据**。

- 已改（UI / 配置 / 文档）：`client/index.html` 标题 → `Omnix - Project Management Workspace`；侧栏 Logo `darklogo.svg` / `whitelogo.svg` 内嵌的模板文字 "Shadcn Dashboard" → "Omnix"（保留图标矢量，文字用 `Inter` `<text>`，亮色 `#0A0A0A` / 暗色 `#FAFAFA`）；登录/注册页品牌 `P` 圆标 + `PMS` → `O` 圆标 + `Omnix`（`aria-label` 同步）；设置页 Workspace Name / Description 默认值 → `Omnix Workspace` / `…building Omnix.`；API key 示例前缀 `pms_` → `omnix_`；头像面板联系邮箱 → `info@omnix.dev`；孤儿模板页（authforms / auth2）的 `ShadcnDashboard` 文案与 `example@shadcndashboard.com` 占位 → Omnix；`README.md` 与 `DESIGN.md` 标题及正文 `OMNIX` → `Omnix`。
- 有意保留：真实外部链接（`x.com/shadcndashboard`、`github.com/shadcndashboard`、`shadcndashboard.dev/docs`、`demos.shadcndashboard.dev/*` 子导航）改了会失效，不动；演示登录邮箱 `bob@pms.com` 是凭据，不动；`pms-audit/` 取证资料与注释中描述取证源的历史 `PMS` 字样是事实记录，不动；内部代码标识符与目录（`views/auth/pms`、`PmsAvatar`、`PmsField` 等）非显示名，避免大规模重命名破坏引用，不改。
- 本节之前所有 `PMS` / 1:1 复刻表述均指取证对象的历史名称；产品当前显示名一律为 **Omnix**。

### 品牌 Logo 换用正式素材（2026-11-15）

用户提供正式 logo（蓝紫渐变无限符号 + Omnix 字标，原图黑底 1080×720），已用 PIL 处理为透明素材并存入 `client/src/assets/images/logos/`：

- `omnix-logo.png`（亮色完整版，857×172，文字保留深藏青原色）、`omnix-logo-dark.png`（暗色版：字标提亮到 `#D4D4D4`，图形渐变与字标上的蓝点保留）、`omnix-icon.png`（仅图形 mark）；`client/public/favicon.ico` 由图形 mark 重新生成（16/32/48 三尺寸）。
- 侧栏 `FullLogo.tsx`：展开态按主题切亮/暗两版（`h-6 w-auto`），折叠态（`group-data-[state=collapsed]`）只显示图形 `size-7`；原模板 `darklogo.svg` / `whitelogo.svg` / `logoicon.svg` 保留在仓库供孤儿模板页引用，不再被侧栏使用。
- 登录/注册页品牌区由「蓝圆 `O` + 文字」改为品牌素材：先试过完整 logo（`h-9`，宽约 179px），用户反馈过大、注册页比例失衡；现改为官方同构「图形 mark + 文字」——`omnix-icon.png` `h-10 w-auto`（图形约 71×40）+ `text-lg font-semibold` "Omnix"，与取证 `size-10` 圆标 + `text-lg` "PMS" 的占宽/高度对齐，登录注册两页共用。
- 亮色版字标为深藏青（近黑），在白底/浅色背景清晰；暗色侧栏一律使用 `omnix-logo-dark.png`。

## 皮肤 CSS 归入 components 层，修复认证页间距（2026-11-15）

用户反馈 `/register` 间距不对并附官方间距标注图。用 Playwright 对官方线上页（`pms-workspace-app.vercel.app/register`）逐项量测后定位根因：**皮肤基类反向覆盖实例工具类**。

- 根因：`style-lyra.css` / `style-vega.css` / `style-variants.css` 以无层级 `@import` 引入，`.style-* .cn-card` 等规则（specificity 0,2,0）压过实例上的 `gap-6 sm:gap-8`、`py-8 sm:py-12`（0,1,0），导致卡片实际渲染 `gap 16px / padding-block 16px`，而官方线上是 `32px / 48px 32px`。
- 修复：三个皮肤文件改为 `@import ... layer(components)`（`globals.css`）。Tailwind v4 层序 `theme → base → components → utilities`，实例工具类恢复可覆盖性，与官方线上的层级行为一致；皮肤文件内 122 处 `!important` 状态规则不受影响。契约文件（layout-contract / theme-tokens / rtl-contract / animation-contract）**保持无层级**不动。
- 修后 `/register` 与官方逐项一致（Playwright 双端实测）：卡片 `padding 48px 32px`、`gap 32px`、圆角 22px、品牌→标题 32px、header→表单 32px（即用户标注图的紫斜纹区）、标题→描述 4px、描述→首字段 32px、字段间 16px、分隔线上下 24px、输入框 36px。
- 全站回归：首页 dashboard、`/settings/layout`、`/projects` 截图目测无破版（皮肤类在无冲突工具类处照常生效）；`build` 产物中 `@layer components` 已生效。此改动让所有「实例工具类 + 皮肤基类」冲突处恢复官方语义，后续写工具类无需再担心被皮肤类压住。

### 隐藏第三方登录区（2026-11-15）

用户要求隐藏「or sign in with」分隔线与 Google/Github 按钮（OAuth 未打通，占位按钮无实际价值）。`login.tsx` / `register.tsx` 移除 `FieldSeparator` + `SocialButtons` 引用，`shared.tsx` 删除 `SocialButtons` 组件及 `google/github` 图标 imports。**有意偏离官方取证**：官方页面含此区块，OAuth 后端打通后按 `pms-audit/raw/page-login.html` 复原（组件历史可查 git）。

### RFQ 雏形骨架（2026-11-15，已删除）

曾按用户要求搭过 RFQ 骨架页（`client/src/views/rfq/index.tsx` + `/rfq` 路由），随后用户明确要求删除 /rfq：**页面文件与路由均已移除**，`/rfq` 现在会落到全局 404 重定向。侧栏 `Quotation` 导航仍走 `/apps/requirements/:stage` 通用占位页，与后端 `Quotation` / `QuotationTemplate` 模型无前端接线。如需重做 RFQ，从 git 历史找回骨架文件即可。

### FAQ 页面 1:1 复刻（2026-11-15）

用户随后提供 FAQ 页面 UI 截图（「Frequently asked questions」/「Still have questions」/「Chat with us」），作为「使用文档」入口的实际页面。

- 新建 `client/src/views/pages/faq.tsx`：顶部标题条（FAQ + Home / FAQ 面包屑）、居中标题/副标题、4 条可折叠问答（Base UI Accordion）、底部咨询卡（3 个叠放头像 + 标题 + 描述 + 深色 Chat with us 按钮）。
- 尺寸比例（2026-11-15 二次修正）：用户反馈初版整体偏小，直接量测官方 `demos.shadcndashboard.dev/theme-pages/faq`（1280×720）后按真实 CSS 对齐——页面标题 20px/600、面包屑 14px、主标题 24px/600、副标题 16px、列表 `max-w-3xl`=768px（4 项共高 219px，单项 55px，问题文字 14px/500、chevron 16px）、咨询卡 `py-6 gap-4`、头像 44px、卡标题 24px/700、描述 16px、按钮 104×36/14px。修后本地逐项量测与官方一致。
- 路由 `/faq` 加入 ProtectedRoute；`NavUser.tsx` 的 Documentation 项 URL 由外链 `https://shadcndashboard.dev/docs` 改为 `/faq`（中文仍显示「使用文档」）。
- 文案按截图保留英文原文（含原站的 adminmart 字样）；折叠答案内容截图不可见，写了简短通用答案。「Chat with us」未接后端，点击给 toast 提示（与第三方登录占位同一处理口径）。
- 注意：本项目的 `Accordion` 基于 `@base-ui/react`（非 Radix），没有 `type` / `collapsible` props，误传会触发 React DOM 警告，已移除。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；1111×621 截图对比参考图、console 0 error。

### 放开 Contacts 导航入口（2026-11-15）

用户要求「打开应用展示，放开联系人」。此前 `sidebaritems.ts` 末尾整体过滤掉 `heading === "Apps"` 分组，导致已有页面 `/apps/contacts`（Contact App）在侧栏、水平导航、顶栏搜索里均不可达。现改为：保留 Apps 组但只留 `Contacts` 一项，并去掉其 `isPro` 标记；其余 Apps 项继续隐藏。侧栏 APPS 分组下可见 Contacts，页面渲染正常。

### 联系人 UI 数据落库（2026-11-15）

审计结论：联系人页此前是纯静态 1:1 复刻——12 条模块级 mock 常量，仅「点击切换选中项」为真交互，详情 `FIELDS`/`NOTES` 全局写死，搜索/增删改/收藏/分组按钮全无 handler；后端已有完整 `contacts` 模块 CRUD 与 `Contact` 表，库内有 36 条业务联系人（不可覆盖）。

用户决策：**不改 schema**，用现有字段近似映射（dept→`customerType`、address→`country`），starred/notes 放 `Setting` KV；其余全做。

- 后端：`prisma/seed.ts` 按唯一 email 幂等追加 12 条 UI 联系人（`@claimab.com` 域名），初始 starred/notes 写 `contacts.ui.starred.<id>` / `contacts.ui.notes.<id>`，KV 的 `update: {}` 保留用户后续修改；Create/Update DTO 补 `avatarUrl`（表已有该列）；`contacts.controller.ts` 新增 `GET /contacts/ui-meta` 与 `PATCH /contacts/ui-meta/:id`（静态路由在 `:id` 前），service 批量读 KV 避免 N+1。
- 前端：新增 `client/src/api/contacts/use-contacts.ts`（SWR 读列表与 KV，封装 create/update/remove/setStarred/setNotes）；`views/apps/contacts/index.tsx` **DOM/类名/文案保持 1:1 不动**，只把静态常量换成 API 数据并给空按钮接真交互。Frequent 无后端字段，以最近创建 6 条近似；新增/编辑用 `window.prompt` 收集，避免引入弹窗改 UI；DELETE 返回 204 无 body，故不用全局 `deleteFetcher`（它会 `res.json()` 而失败）。
- 路由：`/apps/contacts` 从公开组移入 `ProtectedRoute`。
- 验收：seed 复跑后仍为 12 条（幂等）；浏览器实测未登录跳 `/login`、登录后 12 条真实数据、切换详情、搜索、Starred/分类筛选、收藏刷新后保持（KV 生效）、新增→编辑→删除闭环；测试联系人已清除；前后端 build 与 tsc/lint 通过、console 0 error。

### 设置页接入 boxed/full 布局模式（2026-11-15）

用户反馈设置页没接入布局模式并附图（全屏独立设置布局）；确认口径为**保留 FullLayout 外壳，修 boxed/full 响应**。

- 根因：`SettingsLayout` 的内容行/列缺 `min-w-0`（flex 子项默认 `min-width:auto` 被内容撑开），成员页 `<Table className="min-w-5xl">` 把卡片撑到 1028px——boxed 容器只有 888px，所以切 boxed/full 时表格宽度纹丝不动；API Keys 表格另有 15px 溢出。
- 修复：`views/workspace/settings/index.tsx` 内容行与内容列加 `min-w-0`；`members.tsx` 表格卡片改 `w-full overflow-x-auto`（表格在卡内横向滚动）；`api-keys.tsx` 表格容器加 `w-full overflow-x-auto`。
- 验收：boxed 下表格卡片 624px、full 下 720px，随布局模式真实变化；6 个设置子页均无布局溢出（表格内滚动内容除外）；tsc 0 错误、lint 0 error、build 通过。官方取证里设置页本来就带应用侧栏，故未改动外壳。

### 成员页筛选选项中英映射（2026-11-15）

用户要求筛选下拉的选项也做中英文映射（附图：官方截图里角色/项目/工作量下拉均有完整选项）。

- 此前三个 `SettingsSelect` 是装饰性单一选项（`All` / `All projects` / `Any workload`）。现按官方截图补全选项并全部走 `t()`：角色 `All roles / Admin / Member / Viewer` → 所有角色/管理员/成员/查看者；工作量 `Any workload / Has open tasks / No open tasks` → 任意工作量/有未完成任务/无未完成任务；项目为 `All projects`（所有项目）+ 8 个项目专名。
- 项目专名（Website Redesign、Mobile App v2 等）**不做 `t()`**：一是官方中文界面截图里同样保留英文，二是词典中 `Website Redesign` 已有项目创建弹窗 placeholder 的中文译法「为您的新需求取个项目名称」，复用会导致筛选选项文案错误。
- 新增词条：`All roles` / `Has open tasks` / `No open tasks`；`Admin/Member/Viewer/All projects/Any workload` 复用已有词条。
- 验收：Playwright 切中英文实测三个下拉的选项文本（中文：所有角色/管理员/成员/查看者、所有项目+英文项目名、任意工作量/有未完成任务/无未完成任务），测后恢复英文；tsc 0 错误、lint 0 error、build 通过。筛选逻辑本身仍为取证的装饰行为，本次只改选项文案。

### 成员角色与联系人全量文案中英映射（2026-11-15）

用户追加要求：成员列表里的角色、联系人页文案也要中英映射。

- 成员页：角色列 `<span>{t(role)}</span>`、行内角色菜单选项 `t(option)`；邀请弹窗角色下拉给 `SettingsSelect` 新增可选 `formatOption`（显示译文、value 仍是英文 Admin/Member/Viewer），并让触发按钮用 `SelectValue>{formatOption(value)}` 显示译文——否则只有菜单项是中文、trigger 仍显示 `Member`。英文业务值保持不变，不影响角色 state 与筛选逻辑。
- 联系人页：`NAV` / `CATEGORIES` 常量改用 `value`（英文逻辑值）+ `t(value)` 显示；列表与详情的部门值 `t(c.customerType)`；详情字段标签、Notes、Contact Details、Add New Contact / Edit / Delete、搜索占位、加载/失败提示、toast 与确认弹窗全部走 `t()`。`promptContact(t, base)` 接收翻译函数，用户输入的中文部门名会按 `t(c.value) === dept` 反查回英文值再落库。
- 词典：补齐 Frequent / Starred / Sales / CATEGORIES / Contact App / Contact Details / Phone Number / Email address / Address / Department / Company / Add New Contact / Search Contacts... / Delete / 各类 toast 等中文词条；`Name` 复用已有「名称」词条（曾重复定义导致 TS1117，已删除）；`Delete contact {{name}}?` 在 en 段显式声明插值模板。
- 验收：Playwright 中英双端实测——中文下成员角色列「管理员/成员/查看者」、角色菜单与邀请 trigger 中文，联系人标题/导航/分类/部门值/详情标签/按钮全中文；英文下逐项回退原文；测后恢复英文。tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 联系人分类中文语义修正（2026-11-15）

用户指定联系人分类的中文口径：Engineering→供应商、Support→客户、Sales→同事；Notes→备注。

- 通用词条的 `Engineering` 在个人资料页/创建弹窗也用到（原译「工程团队」），直接改会误伤，故新增**联系人专用词条** `ContactEngineering/ContactSupport/ContactSales`（en 声明回退为 Engineering/Support/Sales，zh 为供应商/客户/同事），联系人页通过 `deptLabel(t, value)` 统一取专用文案；英文业务值（后端 `customerType`）不变，prompt 里输入中文分类名也能反查回英文。
- `Notes` 只在联系人页使用，中文词条直接由「笔记」改为「备注」。
- 验收：中文下左侧分类栏显示供应商/客户/同事、列表与详情部门同步、Notes 标题为备注；英文下回退 Engineering/Support/Sales/Notes；个人资料页仍显示「工程团队」（未受影响）。tsc/lint/build 通过。

### 成员真数据化与联系人写权限收紧（2026-11-15）

用户要求：成员页 Alice/Bob 等 8 条 mock 做成真实用户（密码统一 123456，alice@pms.com 为管理员）；完成审计建议第 2/3 步；**不做邀请制**（所有人可自助注册）；登录页删除示例账号。

- seed：8 位成员 upsert 为 `Contact type=user`，统一密码 123456；alice/grace 为 admin、eve 为 viewer、其余 user；原 `bob@pms.com / demo` 改为 123456。
- 后端新端点：`GET /api/auth/users`（任意登录用户可读，排除机器人/服务号/归档账号）、`PATCH|DELETE /api/auth/users/:id`（仅 admin；移除采用 archived=true 归档，避免 Contact 外键引用导致硬删失败）。
- `MemberGuard`：联系人写接口（POST/PATCH/DELETE `/contacts`、PATCH `/contacts/ui-meta/:id`）要求当前会话为 `type=user && password && !isSystem && !archived`；匿名 401、服务号 403。
- Contact Create/Update DTO **移除 type/password/role**，堵住「用联系人接口创建管理员」的提权路径；实测 POST 带这三个字段被 whitelist 剥除，落库 type=customer、role/password 为 null。
- 前端：`useUsers` hook 替换 8 条 mock；角色列/菜单/邀请弹窗用 `roleLabel + t()` 显示（后端 admin/user/viewer ↔ 页面 Admin/Member/Viewer）；角色修改与移除调真 API；邀请提交只提示「注册已开放，可在注册页自助创建账号」，不发邀请邮件；项目/任务/加入时间等真实用户没有的统计显示「—」。
- 登录页：删除 Demo credentials 卡片与 demo 常量；管理员账号改为 `alice@pms.com / 123456`。
- 注意：注册接口会**自动登录**新用户，因此刚注册者的会话是普通 member，改角色/移除成员需重新以管理员登录。
- 验收：alice 登录 201；成员页显示 11 个真实账号（含 8 位新成员）；UI 改角色落库后已恢复；临时用户移除 204；提权字段被剥除；成员新增联系人 201、匿名写 401；所有 QA 测试数据已清理（用户数回到 11）；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 成员表列收敛（2026-11-15）

用户要求：Joined 显示真实创建时间，删掉「项目 / 未完成任务 / 未解决问题」三列，操作列仅管理员可见。

- 后端 `PublicUser` 增设 `createdAt`（ISO 字符串，由 Contact.createdAt 序列化），`/api/auth/users` 直接返回，无需新查询。
- 前端 `MemberUser` 类型同步；Joined 列用 `new Date(createdAt).toLocaleDateString()` 展示真实日期；删除三列后表格由 `min-w-5xl` 改为 `w-full`（4 列自适应，普通成员 3 列宽约 620px）。
- 操作列表头与单元格用 `isAdmin = user?.role === "admin"`（来自 `useAuth`）条件渲染；加载中占位的 `colSpan` 同步为 4/3。后端 `PATCH/DELETE /auth/users/:id` 本身也限制管理员，前端隐藏只是避免普通用户看到点了会 403 的入口。
- 验收：管理员视角 4 列（Member/Role/Joined/操作），11 个操作按钮，日期与 API 的 createdAt 一致；普通成员（bob）视角 3 列、0 个操作按钮；tsc/lint/build 通过。

### 登录页文案、记住设备与忘记密码（2026-11-16）

用户要求：登录页显示「账号/密码」且标签不带星号，占位符做中文翻译，完善记住此设备持久化，补上忘记密码功能。

- 标签由带星号的 `Email*` / `Password*` 改为 `Account` / `Password`（中文「账号」/「密码」）；两个 placeholder 走 `t()`（中文「请输入账号或邮箱」/「请输入密码」）。`Forgot password?` 由 `href="#"` 死链改为真实路由。
- 记住设备：新增 `pms.rememberDevice` 持久化勾选状态（默认 true）；登录时同时保存该开关与 `pms.rememberedEmail`，取消勾选则清除账号。**密码不写本地存储**。刷新后账号与勾选状态都恢复。
- 忘记密码（后端）：新增 `POST /api/auth/forgot-password`（免登录，按邮箱查可登录成员，生成 32 位 hex 重置码写入 `Setting` KV `auth.reset.<token>`，15 分钟有效）与 `POST /api/auth/reset-password`（校验存在/过期，bcrypt 更新密码并立即删除 KV，一次性消费）。项目未配置 SMTP（MailService 会直接报错），所以演示环境把重置码直接返回前端展示，不依赖邮件投递。两个端点都在 `/auth` 前缀下，已被 AuthGuard 白名单放行。
- 忘记密码（前端）：新增 `/forgot-password` 两步页面 `views/auth/pms/forgot-password.tsx`（输入账号邮箱 → 展示重置码 → 输入重置码 + 新密码 + 确认 → 跳登录），路由挂在 BlankLayout 公开组。
- 验收：中英双语标签/占位符正确且无星号；勾选与取消勾选的持久化双向验证通过；完整重置闭环（获取码 → 设新密码 → 新密码登录 201），并已把 Alice 密码恢复为 123456（原密码登录 201）；重置码重复使用返回 400；测试后清理 localStorage 状态。tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 登录跳主页 + 右上角头像带登录状态（2026-11-16）

用户要求：登录后固定跳主页；右上角头像改为带状态的当前用户头像+信息，保留原侧弹全部功能；用户可在侧弹点击头像下拉选择自己当前状态。

- 登录跳转：`views/auth/pms/login.tsx` 去掉 `location.state.from`，成功后固定 `navigate("/", { replace: true })`（`/` = ModernDashboard 主页）；移除不再用的 `useLocation`。
- 当前用户状态：后端 `Contact` 无在线状态字段，`avatar-09` 成员状态仍为演示值不动。在 `layouts/full/vertical/header/Profile.tsx` 新增本地状态 `PresenceStatus`（online/away/busy/offline，默认 online），按用户 id 存 `localStorage["pms.presence.<userId>"]`，刷新保持，不影响后端与其他功能。
- 右上角头像（SheetTrigger）加 `AvatarBadge` 显示当前状态色点；侧弹顶部大头像同样带徽标，点击后用**内联 absolute 卡片**（role=menu / menuitemradio）切换状态并即时写入 localStorage。选完自动收起卡片。
- 关键坑：两者都是 base-ui 组件。最初用 `DropdownMenu`（MenuPrimitive）嵌套在 `Sheet`（DialogPrimitive）内，点击触发头像会连带关闭整个侧弹（`modal={false}` 无效）。改用内联卡片彻底避开弹层嵌套冲突，Sheet 本体与其他功能零改动。
- 验收：登录成功 URL=`/`；右上角徽标默认 `bg-teal-400`（online），无障碍文案读出状态；侧弹头像下拉显示 4 项，选 Away 后徽标变 `bg-amber-300`、状态文字更新、localStorage=`away`、菜单收起而侧弹保持；刷新后徽标/文案保持；中文界面选项为「在线/离开/请勿打扰/离线」。测试后清除状态 key 恢复默认 online。tsc/lint（0 error，3 既有 warning）/build 通过。

### 状态后端化 + 多端通知 + 记住设备会话持久化（2026-11-16）

用户指出上一版 localStorage 状态是错的，要求状态由后端管理并通知各个应用端；同时补齐「Go Back to Home」鉴权、「记住此设备」记住账号密码、后端持久化登录，并按极简原则删除侧弹团队成员与在线文本。

- **数据库**：`Contact` 增 `presence`（默认 offline）与 `last_active_at`，迁移 `20261116000000_add_presence`，`prisma migrate deploy` + `generate` 均通过。
- **后端状态机**（`presence.service.ts`）：登录/注册 → online；登出 → offline；`POST /presence/heartbeat`（前端活动节流 30s 上报）刷新活动时间并把 away/offline 恢复 online；定时巡检（30s）把 5 分钟无活动的 online 自动置 away、15 分钟无活动统一置 offline；用户手动 `PATCH /presence/me` 切「请勿打扰」busy，busy 不被 5 分钟空闲规则覆盖（但超过 15 分钟仍会离线）。非法状态由 `@IsIn` DTO 挡回 400。
- **多端通知**：`@Sse("stream")` 用 rxjs `Subject` 广播全量状态快照，任何变更推送给所有连接端；`GET /presence` 提供断线兜底快照。端点在 `/presence` 下，由全局 session 守卫保护（未登录 401）。`/auth/me`、`/auth/users` 也直接带 presence。
- **前端单数据源**：`AuthContext` 接管 SSE 订阅、首次快照、活动心跳与 `setMyPresence()`；`myPresence` 由后端状态派生，不再读写 localStorage。`Profile.tsx` 侧弹下拉只调用后端 API；成员页头像徽标、`avatar-09` 组件均改读 SSE 的真实状态。
- **Go Back to Home**：新增 `views/auth/HomeLinkButton.tsx`，按登录态鉴权跳转（已登录 `/`，未登录或访客 `/login`），404 与维护页复用；Base UI 用 `render={<Link/>}` 组合按钮，不再嵌套 button>a；补中文词条「返回主页」。
- **记住此设备**：登录页在勾选时把账号**与密码**一起存本地并回填，取消勾选清除两者；`LoginDto` 增 `remember`，后端据此把 session cookie 从默认 7 天改为 30 天持久化（下发 Expires），未勾选改为浏览器会话 cookie（无 Expires）。session 本就落 Postgres（connect-pg-simple），后端重启不掉线。
- **侧弹精简**：按「Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining.」删除 Team Members 区块（`AvatarPresence`）与在线状态文字，仅保留头像徽标颜色表达状态；下拉里的四个选项文字是必要操作文案，保留。
- 验收：`remember=true` Set-Cookie 带 30 天 Expires / `false` 无 Expires；`/auth/me` 返回 presence；账号密码回填与取消勾选清除；404/维护页未登录→`/login`、已登录→`/`、中文「返回主页」；手动切 busy 后徽标 `bg-orange-400` 且第二端 SSE 收到 busy 帧；UTC 回拨 6 分钟验证自动 away、活动心跳恢复 online、登出 offline；非法状态 400；成员页 8 行均带状态徽标，侧弹无团队成员/在线文本。测试后清空本地存储并把 DB 状态恢复全 offline。server build / tsc / lint（0 error，3 既有 warning）/ client build 通过。
- 排查记录：`timestamp without time zone` 列用 psql 直接写本地墙上时间会被 Prisma 当 UTC 解析（差 8 小时），模拟空闲需写 `(now() at time zone 'utc')`；`nest start --watch` 曾出现新 controller 已加载但旧 service 实例未刷新的不一致，验收前重启一次后端即可。

### 全站登录墙：访问 / 校验登录态（2026-11-16）

用户要求：`http://localhost:5173/` 导航时必须校验登录态，未登录去 `/login`，并完善登录功能。

- **根因**：`Router.tsx` 里 `FullLayout` 整组（含 `/` 主页、所有 dashboards/apps/tables 模板页）没有登录墙；`ProtectedRoute` 只包了 PMS 业务子路由，且带 `bypass`——后端不可达时以访客模式放行，等于整站可绕过鉴权。
- **整组登录墙**：`Router.tsx` 把 `FullLayout` 组的 element 改为 `<ProtectedRoute><FullLayout /></ProtectedRoute>`。`ProtectedRoute` 增加可选 `children`：传入时渲染布局（布局内部仍是 `<Outlet />`），不传时作为路径守卫渲染 `<Outlet />`。原内层 PMS 登录墙改为纯 `<Outlet />` 分组，避免重复校验。
- **严格校验**：彻底移除 `bypass`（`AuthContext`、`ProtectedRoute`、`HomeLinkButton`）。`/api/auth/me` 401 → `user=null`，后端不可达也保持未登录，一律由登录墙送回 `/login`。
- **导航时复核**：`AuthContext.revalidate(force?)` 每次 SPA 导航由登录墙强制向后端确认 `/api/auth/me`，窗口聚焦 / `visibilitychange` 走 20s 节流的后台校验，覆盖休眠、跨标签登出、session 过期。用 `revalidateSeqRef` 序号丢弃过期响应，登录/注册/登出/401 事件都会使在途复核失效，避免并发把已失效会话错误恢复。仍有效时保留 `user` 原引用，不触发全应用重渲染与 SSE 重连。
- **全局 401**：`api/auth.ts` 抽 `assertOk`，受保护接口返回 401 时广播 `pms:session-expired`，`AuthContext` 监听后清空登录态。`/api/auth/login|register|forgot-password|reset-password|logout` 列入白名单——密码错误的 401 不能误判为会话失效。SSE 快照与心跳的 fetch 也接入该通知。
- **登录闭环**：新增 `GuestRoute`，已登录访问 `/login`、`/register`、`/forgot-password` 直接回 `/`；抽出共享 `AuthLoading` 供两层守卫复用。`ProtectedRoute` 去掉未使用的 `state.from`——登录后按既定需求固定回主页。
- 验收：未登录访问 `/`、`/settings/members`、`/projects/abc` 均跳 `/login`；登录后回 `/` 且侧栏正常；已登录访问 `/login`、`/register` 回 `/`；真实 SPA 链接导航每次触发一次 `/api/auth/me`（1→2）；后端登出后 SPA 导航立即被拦回 `/login`；广播 401 事件后停在 `/login`；错误密码显示 `Invalid credentials` 且停留在登录页（不误跳）；登出回 `/login`。测试后清理本地存储并把 DB 状态恢复全 offline。tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。
- 行为变更：原「后端不可达时放行访客以便纯 UI 演示」已取消，现在任何情况下未登录都不能进入主应用。

### 右上角头像与个人设置接入真实用户（2026-11-15）

- 后端 `PublicUser` 增加 `avatarUrl`（空值兜底 `/images/profile/user-1.png`）；`UpdateProfileDto` 改为 name 可选 + avatarUrl 可选，`PATCH /auth/me` 支持局部更新。`seed` 给 8 位成员分配 `user-1..8.png`。
- 前端 `AuthUser` 同步 avatarUrl/createdAt；`authApi` 增加 `updateProfile` / `changePassword`；`AuthContext` 暴露 `updateUser` 供保存后立即刷新会话显示（不必重新登录）。
- 顶栏 `header/Profile.tsx`：右上角头像、抽屉内头像/姓名/邮箱、首字母 fallback 全部取自当前会话，不再用 `Cameron / info@omnix.dev / avtar.webp` 静态值。
- `/profile`：资料卡头像/姓名/角色/邮箱/加入日期取真实数据；Personal Info 表单改为受控——姓名与头像 URL 保存走 `PATCH /auth/me`，填了密码则另走 `PATCH /auth/password`，邮箱只读（后端不支持改邮箱）。通知/社交/团队/危险区仍保留取证时的静态形态。
- 验收：alice 登录后右上角显示 `user-1.png`、抽屉与资料页显示 Alice Johnson / alice@pms.com / Admin；把姓名改为 Alice QA、头像改为 user-5.png 并保存，刷新后仍保持且右上角同步；测试数据已恢复原值。tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 成员筛选与分页真实化（2026-11-15）

用户要求：去掉「所有项目 / 任意工作量」两个假筛选，角色筛选做成真的，分页器真实可用。

- 删除 `All projects` / `Any workload` 两个 `SettingsSelect`（原本只有一个选项、无 handler）。
- 角色筛选：`value` 用后端英文角色值 `all/admin/user/viewer`，`formatOption` 显示 `All roles` / `Admin/Member/Viewer` 的译文，`onValueChange` 真实过滤并重置页码；与搜索框是「与」关系。
- 分页：`pageSize` 可选 8/16/32，搜索/筛选/每页条数变化都重置 `page=1`；用 `slice((currentPage-1)*pageSize, currentPage*pageSize)` 取当前页；区间文本 `x-y of n`、动态页码按钮、上一页/下一页 disabled 状态全部基于真实数量。移除成员后页码会自动收敛到有效范围。
- 验收：11 人默认每页 8 → 第一页 8 行「1-8 of 11」、第二页 3 行「9-11 of 11」；筛选 Admin → 3 位管理员、页码只剩 1；每页改 16 → 11 行「1-11 of 11」；中英文选项文案（所有角色/管理员/成员/查看者）正确；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 头像真实落库 + shadcn Avatar block（2026-11-15）

用户要求：头像不要填外链 URL，改为真实上传落盘；个人设置里可选用系统内置头像；并提供用户指定的 shadcn block `avatar-10.tsx`。

- 项目结构核对：`components.json` 的 `@/components` 指向 `src/components`；React 19.2.8、Tailwind 4.3.3、TypeScript 6.0.2（高于要求的 ^5，语法向下兼容，无需降级）；`Avatar`/`Button` 已存在，`--ring` 等主题变量已在 `src/css/globals.css`，**无需新增依赖或全局样式**。用户给的 `components/shadcn-dashboard/...` 路径按 alias 实际落在 `src/components/shadcn-dashboard/avatar/avatar-10.tsx`（放在 client 根会 TS2307）。
- block 保留原视觉结构（size-20 头像 + hover Camera 遮罩 + Upload/Remove + 2MB 校验 + 错误提示），接真实逻辑：上传走后端已有的 `POST /api/upload`（multipart `file`，落盘 `uploads/` + `/uploads` 静态托管），成功后 `PATCH /auth/me` 把返回的相对路径写入 `Contact.avatarUrl`（DB 只存路径，不是外链）；Remove 恢复系统默认头像；额外增加 10 个系统内置头像（`user-1..10.png`）直接选用。
- `/profile` 移除了手填「Avatar URL」输入框，改为渲染该 block，保存后同步 `avatarUrl` state 与会话，右上角头像即时更新。
- 验收：block 渲染正常（10 个系统头像）；选 user-5 落库；上传 1×1 PNG 后 DB 为 `/uploads/<uuid>.png` 且文件请求 200；已恢复 user-1 并删除测试上传文件；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 成员头像修正 + 头像 block 中英与单行平铺（2026-11-15）

用户反馈「团队成员头像没有正确显示」并要求「做成中英文、头像平铺成一行」。

- 根因：后端 `/api/auth/users` 早已因 `PublicUser` 返回 `avatarUrl`，但前端 `MemberUser` 类型漏了该字段，成员页仍用 `email.charCodeAt(0) % 10` 猜头像，导致多数人重复显示 user-1。现改为 `avatarSrc(member.avatarUrl)`：8 位 seed 成员正确显示 user-1..8，老账号走后端默认 user-1。
- 附图里第 10 个缩略图看起来像图标：`user-10.png` 本身是蓝天自拍人像，所有 10 张图 `naturalWidth` 正常、并非加载失败；真正的问题是 block 外层 `max-w-sm`（384px）让第 10 个换行。
- 布局：block 外层去掉 `max-w-sm`，默认头像容器改 `flex-nowrap overflow-x-auto`，10 个头像单行平铺；补 `AvatarFallback`（序号）避免极端情况下空白。
- i18n：block 内所有可见文案走 `t()`（Profile photo / 大小提示 / Upload / Remove / Saving / 错误提示 / Choose a default avatar / aria-label），新增中英词条与 3 个插值模板的 en 声明；`Remove` 复用已有词条。
- 验收：英文下 10 个头像 1 行、文案英文；中文下头像/上传/移除/选择系统默认头像/大小提示全中文；成员页 8 位成员头像与 seed 分配一一对应。tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 右上角头像抽屉接入 avatar-09 block（2026-11-15）

用户要求把带在线状态的成员头像列表（shadcn block `avatar-09.tsx`）接到右上角头像。

- 项目结构已满足（shadcn alias、React 19.2.8、Tailwind 4.3.3、TS 6.0.2），`AvatarBadge` 已由 `src/components/ui/avatar.tsx` 导出，**无需新增依赖或全局样式**。按 `components.json` 的 `@/components` → `src/components`，文件落在 `src/components/shadcn-dashboard/avatar/avatar-09.tsx`（与 avatar-10 同一目录）。
- block 保留原视觉结构（`ul` 列表、`Avatar size="lg"`、`AvatarBadge` 状态徽标、offline 灰度、状态圆点），但把静态 `people` 数组改为 `useUsers()` 的真实注册用户（前 4 位）+ `avatarSrc(person.avatarUrl)` 真实头像；后端暂无在线状态字段，四个状态按原 block 顺序作为展示值。
- 状态标签走 i18n：Online/Away/Offline 复用已有词条，新增 `Do not disturb` →「请勿打扰」。
- 集成到 `header/Profile.tsx` 头像抽屉：在顶部个人资料卡与菜单列表之间插入「Team Members」区。
- 验收：抽屉显示 4 位真实成员（管理员/sunny/拖拽测试/Bob Smith）及真实头像与状态徽标；中英文文案均正确（团队成员/在线/离开/请勿打扰/离线）；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 个人信息移除默认头像行（2026-11-15）

用户要求个人信息页不再出现默认头像平铺行。`avatar-10.tsx` 删除 10 个系统头像网格与「Choose a default avatar / 选择系统默认头像」提示，`DEFAULT_AVATARS` 简化为单个 `DEFAULT_AVATAR`（仅供 Remove 恢复默认），同时移除 `avatarSrc` import 与 `chooseDefault` handler。上传 / Remove 按钮与真实落库逻辑不变。验收：页面上默认头像按钮与提示均为 0，Upload/Remove 仍在；tsc/lint/build 通过。词典里的 `Use default avatar {{n}}` / `Choose a default avatar` 词条保留但不再使用。

## 右下角 Customizer 收口进设置「布局」页（2026-11-15）

用户要求「把右下角的 Customizer 放入 settings 中新加一个布局页」，按**移动**（非复制）处理：入口唯一化，不保留重复的右下角浮标。

- 新页 `/settings/layout`：`views/workspace/settings/layout.tsx`，沿用 `SettingsLayout` + `div.space-y-4` + 官方 `Card / CardHeader / CardTitle / CardContent` 结构；`TABS` 在原有 5 项**末尾**追加 `Layout`，避免打乱既有 1:1 取证顺序；路由仍在 `ProtectedRoute` 内。
- 控件来源：`components/shared/Customizer.tsx` 由「浮标 + 手写 Sheet」重构为纯控件 `CustomizerControls`（默认导出），6 个分组逐一迁入：Theme Style（7 套 `data-style-option`）、Theme Option（Light / Dark → `ThemeContext`）、Theme Direction（LTR / RTL）、Choose Your Theme Colors（两个透明 `<input type=color>`）、Layout Type（Vertical / Horizontal）、Container Option（Boxed / Full）。`OptionButton` 的几何 / 配色 / `aria-pressed` 一律沿用原实现，只把分组外壳换成设置页 Card。
- 状态契约**不变**：仍走 `CustomizerContext` 的 `set / setPrimaryColor / setSecondaryColor` 与 `ThemeContext.setTheme`；`index.html` 内联 ThemeInitializer、`globals.css` 的 `@import` 与 `@custom-variant`、`layout-contract.css`、`theme-tokens.css`、`rtl-contract.css`、三份 `style-*.css` 全部保留，一个都不能删。
- **有意偏离 1:1 基线**：`FullLayout.tsx` 不再挂载 `<Customizer />`，`data-customizer-trigger`（旋转齿轮浮标）、`data-customizer-panel` / `cn-sheet-*` 的右侧 Sheet DOM 随之消失；C5 / REA 5 态矩阵中「点击浮标弹出 384px Sheet」一态不再适用，后续验收以 `/settings/layout` 页面为准。如需恢复快捷入口，在 `FullLayout` 加回挂载并另写浮标包装即可，控件本体可直接复用。
- 文案全部走 `t()`，中英成对；`Vega / Nova / Maia / Lyra / Mira / Luma / Rhea`、`LTR / RTL` 按技术专名保留原文。

### 全局 toast 替换为 Sonner 08 - Toast Types（2026-11-16）

用户要求创建 shadcn block `sonner-08.tsx` / `toaster.tsx`，并**替换全局 toast**（不只是加一个 demo）。

- 结构核对：`components.json`（base-nova）的 `@/components` → `src/components`，故用户给的 `components/shadcn-dashboard/...` 落在 `client/src/components/shadcn-dashboard/sonner/`；React 19.2.8、Tailwind 4.3.3、TS 6.0.2（高于要求的 ^5，语法向下兼容，不降级）；`--color-popover` / `--popover-foreground` / `--radius-*` 已在 `src/css/globals.css`，**无需新增依赖或全局样式**。`@base-ui/react@1.8.0` 已在依赖中，用 `npx shadcn@latest add toast --overwrite` 生成 `src/components/ui/toast.tsx`；CLI 写入的 `import { cn } from "cn"` 已改为 `@/lib/utils`，并恢复被 CLI 覆盖的 `button.tsx`。
- block 实现：`toaster.tsx` 提供六向 `PositionedToaster`、`ToastData`、按 `type` 的 `typeIcons`、top 位堆叠翻转；`sonner-08.tsx` 是 6 种类型 demo（局部 manager + top-right）。类型化 tones（圆形图标 / 描边 / 按钮配色）抽到同目录 `tones.tsx`，demo 与全局共用唯一实现，视觉逐项不变。
- 全局替换：`App.tsx` 由旧 `components/ui/sonner`（Sonner `<Toaster position="top-center" />`）改为 `PositionedToaster manager={toastManager} position="top-center"`；删除 `src/components/ui/sonner.tsx`，`npm uninstall sonner --workspace client`（lock 中仅剩 `@univerjs` 的传递依赖）。
- 兼容层 `src/components/shadcn-dashboard/sonner/toast.ts`：模块级 `createToastManager()` + `Object.assign` façade，保留 `toast.success/error/info/warning/loading/message/reminder(message, { description, duration, id, icon, closeButton, action })`、`toast(message)` 与 `toast.dismiss(id?)`；按 tone 注入 `toneData()` 的圆形图标与描边，`loading` 改用 `typeIcons` 的 spinner。10 个调用点（登录/注册/忘记密码/个人信息/成员/联系人/FAQ/右上角 Profile/avatar-10）只改 import，17 处调用零改动。
- 行为差异：底层由 Sonner 换成 Base UI Toast；位置沿用原 `top-center`，默认无关闭按钮（与原 Sonner 一致，可用 `closeButton: true` 开启）；配色沿用线上取证色板 teal / sky / amber / destructive / blue。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；浏览器动态触发 success/error/info → 3 个 `[data-slot=toast]`，分别带 `border-teal-400/30` / `border-destructive/30` / `border-sky-400/30` 与对应图标，viewport `sm:inset-x-0` 居中；真实登录失败链路弹出 `Invalid credentials` 错误 toast；warning / loading / dismiss 与 demo 模块加载均正常；0 新增 runtime error（控制台既有 `/api/auth/me` 401 与 MSW 版本 warning 与本改动无关）。

### 成功类操作提示补齐（2026-11-16）

用户反馈「登录成功、项目创建成功、保存成功的提示都没有了」。

- 排查结论：**不是全局 toast 替换导致的丢失**。浏览器实测 `toast.success` 在 `/login` 与主应用 `/` 均可见（Portal 挂 `BODY`、`position:fixed`、`z-index:50`，`elementFromPoint` 命中 toast 标题），SPA 路由跳转也不清空已触发的 toast；`git log -S` 与全量 `git grep` 证明登录/注册成功分支、项目 `create`、项目详情 `submit` 在改动前后都没有 `toast.success` 调用，成功提示集合完全一致。真正原因是这些成功分支只有「写 store + 关弹窗 + `navigate`」，本来就没有反馈。
- 补齐范围（**只在真实写入分支加提示**，`settings/general.tsx` 等纯 `preventDefault()` 占位表单不加假提示）：`views/auth/pms/login.tsx` 登录成功、`register.tsx` 注册成功、`views/workspace/projects/index.tsx` 新建项目、`projects/detail.tsx` 编辑项目保存、`projects/project-actions.tsx` 详情各弹窗保存（`archive` 不发保存类提示）。统一走 `@/components/shadcn-dashboard/sonner/toast` 的 `toast.success`，不加第二套提示组件。
- i18n：`i18n/resources.ts` 的 `ch` 段新增 `Logged in successfully / Account created / Project created / Saved successfully` 四条中文词条；英文为源语言回退，`en` 段无需改动。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；真实登录成功跳转 `/` 后显示 `Logged in successfully`（`border-teal-400/30`）；切中文后三条文案分别为「登录成功」「项目创建成功」「保存成功」。重启 dev server（`npm run dev -- --force`）清掉卸载 `sonner` 后的 Vite 预构建缓存，避免旧标签页残留旧模块。

### toast 右上角统一 + 每条提示补描述 + 控制台告警清理（2026-11-16）

- 位置：`App.tsx` 的 `PositionedToaster position` 由 `top-center` 改为 `top-right`，与 Sonner 08 demo 一致；浏览器实测 toast 距右/上各 16px。
- 描述：`sonner/toast.ts` 增加 `DETAIL_KEYS`（登录/注册/项目/保存/联系人/成员/头像/重置密码/失败等标题的中英文原文精确匹配）与 `TONE_DETAILS`（按 tone 兜底），`show()` 用 `description: options?.description ?? i18n.t(...)`；**调用点零改动，每条 toast 自动获得第二行描述**（显式传 description 时优先）。`i18n/resources.ts` 的 `ch` 段新增 27 条描述词条，英文按源语言回退。文案组织原则：描述给出「接下来能做什么 / 更改落在哪里」，不复述标题（如「项目创建成功」→「新项目已打开，可继续补充需求、任务与进度。」）。
- 控制台修复：`npx msw init public` 将 `client/public/mockServiceWorker.js` 从 2.14.2 升到 2.15.0，消除 MSW 版本不匹配 warning 与 `mockServiceWorker.js:238 passThrough → Failed to fetch` 的两个 error；`header/Notifications.tsx` 的 `<Button render={<Link to="#" />}>` 补 `nativeButton={false}`，消除 Base UI「expected a native <button>」error。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；全新浏览器上下文复测 console **0 warning**，截图中的 3 个 error 全部消失；真实登录成功 toast 右上角两行显示 `Logged in successfully` + `Your workspace is ready. Pick up where you left off.`。仅剩 `/api/auth/me` 未登录 401 —— 这是登录墙每次导航主动校验会话的预期响应，不是故障。

### Theme Style 真正生效 + 访客页隔离（2026-11-16）

用户反馈「布局的主题风格没有正确应用」。

- 根因：`css/globals.css` 把三份皮肤（`style-lyra.css` / `style-vega.css` / `style-variants.css`）导入在 `layer(components)`。Tailwind v4 的层序是 theme → base → components → utilities，而 Button / Card / Input 自带 `rounded-lg`、`h-8`、`px-2.5` 等 utilities 类，皮肤里的 `.style-x .cn-y` 属于 components 层，**整层被 utilities 压住**。实测 7 套风格互相切换的 computed style diff 为空，只有 `<html>` 的 class 变了。
- 修复一：三份皮肤改导入 `layer(utilities)`。同层内靠 `.style-x .cn-y` 的 (0,2,0) 特异性压过实例工具类 (0,1,0)，同时不越过无层的 `layout-contract.css` / `theme-tokens.css`。实测 7 套产生不同规格：按钮圆角 vega 8 / nova 12 / maia 26 / lyra 8 / mira 8 / luma 26 / rhea 18，卡片圆角与内边距同步变化。
- 修复二：皮肤进 utilities 层后会反向覆盖登录页的 `gap-8` / `sm:py-12`（AuthCard 的实例工具类），故在 `BlankLayout` 挂载时从 `<html>` 摘掉 `style-*`，在 `FullLayout` 挂载时按 `state.activeStyle` 补回。访客页恢复 utilities 优先（卡片 gap 32px / paddingTop 48px），登录后主应用自动恢复当前皮肤。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；登录页 `html.class` 仅 `light`、卡片 gap 32px；登录后 `light style-maia`、按钮 26px；7 套逐一实测均有差异。

### 阶段页新建入口改为网格末尾卡片（2026-11-16）

- 需求：去掉阶段 tab 右上角 hover 浮现的 `+` 按钮，改为在卡片网格末尾补一个「添加阶段」卡（仿 shadcn 风格）。
- 实现：`projects/detail.tsx` 的 `addBar` 在 `case "Sprints"` 直接返回 `null`，其余 tab 的 hover 入口保持不动；阶段网格 `visibleCards.map` 之后追加一个虚线按钮卡（`border-dashed` + 居中圆形加号 + `Add stage` 文案，`min-h-[172px]`、hover 时边框与底色微变、`focus-visible` 走 ring）。点击复用 `setDialog({ kind: "sprint" })`，与原先的新建迭代弹窗同一入口。
- i18n：新增 `Add stage` → 「添加阶段」，英文按源语言回退。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；阶段页实测右上角 hover 按钮不存在（`hoverButtonExists: false`），添加卡位于网格最后一个（第 12 个节点）、尺寸 219×173、`borderStyle: dashed`，点击弹出 `New Iteration` 表单。
- 追加（同日）：网格保持内容高度、添加卡用 `self-stretch` 跟随同行 stretch，三种卡片同行等高（最后一行实测 227 / 227、底边对齐 0px）。曾试过 `auto-rows-fr`，会把行高按容器剩余高度分配、卡片之间出现大片空隙，已回退。
- 同一改动：`RowActions` 的 `onDelete` 改为可选、新增 `editIcon: "edit" | "external"`，预设阶段只渲染 `ArrowUpRight`（aria-label `Open`）且**不渲染删除按钮**（`hideStageCard` 入口随之移除），自定义迭代仍保留 Pencil + Delete。

### 新建项目预置需求任务 + 任务落库（2026-11-16）

- 需求：新建项目时在「需求」阶段预置两条任务（客户画像 / 产品需求，文案润色），接入任务栏，并让任务成为真实可入库的产品功能。
- 实现：`project-stages.ts` 的 `createProject` 内定义 `SEED_TASKS`，创建项目时同一次 `commit` 写入两条 `WsTask`（`task-seed-<projectId>-<index>`，status `todo`、priority `medium`、due `+7d`），并各追加一条 `activity`。任务归属项目（`WsTask` 无阶段字段），经 `mergeWorkspaceSnapshot` 自动并入 `snap.tasks`，无需改任务栏。
- 任务栏接入：项目详情 Tasks tab（`snap.tasks.filter(projectId===id)`）与全局 `/tasks`（`snap.tasks`）原本就读真实 store，两条预置任务自动出现；刷新后仍在（`omnix-workspace-project-stages-v1` 持久化 + 多标签同步）。
- 真实可入库补强：`/tasks` 列表的完成勾选此前是纯展示，现接 `updateRecord("tasks", id, { status })`，勾选 / 取消即写 `recordEdits` 并落 localStorage，项目进度由任务完成度自动推导。
- 润色文案：「建立客户画像」——梳理目标客户的行业背景、采购角色与决策链路，明确关键诉求与痛点，为后续方案与报价提供依据；「梳理产品需求」——汇总客户对功能、规格、交付与验收的期望，形成可追踪的需求清单，作为打样与生产的输入。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；新建项目后 localStorage 出现两条 `task-seed-*`，详情 Tasks tab 与全局 /tasks 均显示两条，勾选完成写入 `recordEdits.tasks[id].status=done` 且刷新后 checkbox 仍为勾选态；测试数据已按备份恢复。

### 任务真实入库后端 + 增删改查（2026-11-16）

用户澄清：「入库」指入后端数据库（PostgreSQL），任务列表要真实增删改查（此前是 MSW 示例数据）。

- 审计结论：后端为 NestJS + Prisma + PostgreSQL（4000 端口），但**没有任务模型/模块**；前端任务由 `workspace-data.ts` 的 MSW 快照示例数据 + `project-stages.ts` 的 localStorage overlay 承载。故本次做全栈改造。
- 后端：
  - `prisma/schema.prisma` 新增 `model Task`（title/description/status/priority/labelIds String[]/assigneeId/dueDate DateTime?/sprintId/estimate Int?/projectId String/parentId/createdAt/updatedAt；`projectId` 仅字符串关联——工作区项目仍由前端快照承载，不建外键），`@@map("tasks")`。
  - 迁移 `20261116010000_add_tasks`。因历史存在 `design_orders` 漂移（`design_fee_amount` → `sample_fee`，非本次引入），`migrate dev` 要求 reset 会丢数据，故用 `prisma db push` 建表（仅建 tasks，无破坏）后 `migrate resolve --applied` 对齐历史。
  - 新增 `src/modules/tasks/`：`CreateTaskDto` / `UpdateTaskDto` / `TasksService`（list/create/update/remove）/ `TasksController`（GET/POST/PATCH/DELETE，写操作 `@UseGuards(MemberGuard)`），注册进 `app.module.ts`。
- 前端：
  - 新增 `src/api/tasks/use-tasks.ts`：`useTasks(projectId?)`（SWR 读 `/api/tasks`）+ 独立 `createTask/updateTask/removeTask` API，写后 `globalMutate` 刷新所有 `/api/tasks*` 缓存。
  - 任务列表页 `/tasks` 改用 `useTasks`：数据、新建、完成勾选（`updateTask`）、行尾删除按钮（`removeTask`）全部走后端，表头新增操作列。
  - 项目详情 `detail.tsx`：`useTasks(id)` 读取，Tasks tab 删除走后端。
  - `project-actions.tsx` 的任务新建/编辑（task case）改为 `createTask/updateTask` 后端，`submit` 转 async。
  - 预置任务：`project-stages.ts` 导出 `SEED_TASKS`（不再写 localStorage），`projects/index.tsx` 新建项目后 `Promise.all(createTask)` 写入后端。
- 验收：后端 curl 登录→list 空→create→update(status done)→delete(204) 全通；前端 UI 新建项目后后端出现两条预置任务（建立客户画像 / 梳理产品需求），全局 /tasks 与详情 Tasks tab 均显示，勾选完成落库为 done、删除后后端仅剩一条；tsc/lint/build 全过；测试任务与 localStorage 状态已清理恢复。

### 项目行操作菜单对齐截图（2026-11-16）

- 菜单结构（`project-row-actions.tsx` 重写）：Copy link / Copy ID / Open in new tab ｜ Open project ｜ Move to（子菜单）/ Duplicate / Mark as completed ｜ Archive project / Delete project（destructive），三条分隔线，与截图分组一致。
- Move to 子菜单改为**项目状态**切换（此前错误地复用 STAGES 阶段）：Active（CircleDot 灰）/ On hold（PauseCircle 黄）/ Completed（CircleCheck 绿），当前状态右侧打勾；`DropdownMenuSubContent side="left"` 使子菜单在左侧弹出，与截图一致。
- 新增 Duplicate：`createProject(name + " copy", description, currentStage, {status, priority, dueDate})` 后 toast + 跳转新项目；新增 Archive project：`archiveProject(id)`。移除原来独立且语义重复的「Active project」项。
- i18n 补 `Archive project` → 「归档项目」、`Duplicate` → 「创建副本」；其它文案沿用既有词条。
- 验收：菜单项抓取顺序为 `Copy link / Copy ID / Open in new tab / Open project / Move to / Duplicate / Mark as completed / Archive project / Delete project`，悬浮 Move to 展开 `Active / On hold / Completed`；截图核对分组与图标颜色一致；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 任务列表优先级 / 倒计时 / 状态下拉 / 经办人下拉（2026-11-16）

- 优先级 → 预估工时：`PRIORITY_HOURS = { none: 24, low: 12, medium: 8, high: 4, urgent: 2 }`。新建任务按优先级写入 `estimate`，修改优先级时同步把 `estimate` 置为该档默认值。
- Estimate 倒计时：以 `createdAt` 为起点按预估工时倒数（每分钟 tick 重算，`Math.ceil` 取整小时，耗尽显示 `0h`）；到期日固定为**创建时间 + 7 天**，新建任务由前端写入 `dueDate = now + 7d`。
- 优先级列改为下拉：Urgent / High / Medium / Low / None（降序，带 ↓↑— 图标与颜色，当前项打勾），文案 `Change priority`。
- 状态列改为下拉：Backlog / Todo / In Progress / Review / Done / Closed（表格中 closed 仍并入 Done 组，菜单用 `STATUS_MENU_LABEL` 区分 Closed），文案 `Change status`。
- 经办人列改为下拉：Unassigned + `snap.users` 全体成员（头像 + 姓名，当前项打勾），文案 `Assign to`；新建任务默认经办人为创建人 `CURRENT_USER_ID`。
- 未指派（`assigneeId` 为空）的任务隐藏行尾删除按钮。
- 项目列表移除 Stage 列（同时删除 `stageName` 与 cells 中的阶段单元格，表头为 Project / Lead / Members / Progress / Priority / Due date）。
- i18n 补 `Change priority`（修改优先级）、`Change status`（修改状态）、`Assign to`（指派给）；`PRIORITY_OPTIONS` 增加 `none`。
- 验收：任务行实测未指派 `deleteBtn=false`、已指派 `deleteBtn=true`；优先级下拉 `Urgent/High/Medium/Low/None`、状态下拉 `Backlog/Todo/In Progress/Review/Done/Closed`、经办人下拉 `Unassigned + 8 位成员`；点选 Urgent 后后端 `estimate` 由 12 变 2；项目列表表头已无 Stage；tsc/lint/build 全过，测试任务已清空。

### 任务列表：标签列替换为阶段列（2026-11-16）

- 需求：任务里的「标签」改为「阶段」。
- 实现：`tasks/index.tsx` 的 `labelsOf(task)`（读 `labelIds`）替换为 `stageOf(task)`——按 `task.projectId` 在 `snap.projects` 中定位下标后调用 `projectStage(projectId, index)`，取项目当前阶段并用 `stageLabel(key, isZh(lang))` 本地化；组件内加 `useProjectStageStore()` 订阅阶段变更。
- 三处渲染统一改为蓝色阶段徽标（`bg-blue-500/10 text-blue-500`，`h-5 rounded-4xl text-[11px]`）：List 表格的 `Stage` 列（表头 `HEADERS` 由 `Labels` 改为 `Stage`）、Board 卡片、任务详情 `PmsSheet` 的 `Stage` 字段（原 `Labels` 字段移除）。
- 清理：移除不再使用的 `labelsOf`、`PmsLabelChip` 导入与 `useWorkspace()` 的 `label` 解构。`Stage`/`Labels` 中文词条沿用既有 `Stage: 阶段`。
- 验收：表头无 `Labels`、`Stage` 位于第 4 列；实测任务行阶段单元格为 `Requirement`（项目 p1 处于需求阶段），看板卡片同样显示 `Requirement`；详情面板 `hasStageField: true`、`hasLabelsField: false`；tsc/lint/build 全过，测试任务已删除。

### 预估工时与到期日改为后端统一推导（2026-11-16）

- 问题：预置任务行的`预估`与`到期`显示 `—`。原因是 `projects/index.tsx` 创建预置任务时只传了 title/description/status/priority/projectId，`estimate` 与 `dueDate` 落库为 `null`；默认值逻辑此前只在前端任务新建表单里。
- 后端（唯一事实源）：`TasksService` 新增 `PRIORITY_ESTIMATE`（none 24 / low 12 / medium 8 / high 4 / urgent 2）与 `DUE_IN_DAYS = 7`。`create` 未显式给出时按优先级补 `estimate`、按「now + 7 天」补 `dueDate`；`update` 改 `priority` 且未显式传 `estimate` 时联动为新优先级默认工时。
- 前端简化：`tasks/index.tsx` 删除本地 `PRIORITY_HOURS`，新建任务不再自行计算 `estimate/dueDate`，改优先级也只传 `priority`，全部交由后端推导，避免两处映射漂移。
- 历史数据：对已有两条预置任务（estimate/dueDate 为 null）按「创建时间 + 7 天」与优先级默认值补齐。
- 验收：`POST /tasks` 只带 title/priority/projectId 时返回 `estimate: 8`、`dueDate` 距 `createdAt` 恰为 7.0 天；`PATCH {priority:"urgent"}` 后 `estimate` 变 2；页面两条预置任务显示「需求 / Medium / 8h / 11月23日 / Todo / Unassigned」。后端 build、前端 tsc/lint/build 全过。

### 任务默认优先级跟随项目 + 未指派占位头像（2026-11-16）

- 默认优先级：`create-dialogs.tsx` 的 `NewTaskDialog` 新增 `defaultProjectId`，打开时以当前项目（`getActiveProject()`）作为默认项目，并按该项目 `priority` 初始化优先级；项目选择框 `onChange` 同步把优先级改为新项目优先级（用户仍可手动覆盖）。任务页 `create` 再兜底一次：`priority: values.priority || 项目优先级 || "medium"`。新建项目时写入的两条预置任务优先级也改为 `created.priority ?? "medium"`。
- 未指派行样式：任务列表 Assignee 单元格在 `assigneeId` 为空时渲染 24×24 虚线圆占位头像（`rounded-full border border-dashed` + `UserRound` 图标）再跟 `Unassigned` 文案，与下拉菜单里的 Unassigned 项视觉一致；该行仍隐藏删除按钮。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；实测未指派行 `hasAvatarPlaceholder: true`、`hasUserIcon: true`、占位 24×24；打开新建任务弹窗时 Project 默认当前项目、Priority 自动为该项目优先级（p1 → `high`）。

### 任务显示项目编号 + 项目模块真正落库后端（2026-11-16）

- 任务列表：`tasks/index.tsx` 的 Project 单元格改为两行（项目名 + 蓝色小字编号 `#26xxxx`），编号用 `projectNo(task.projectId, index)`，与项目列表同源。
- 审计结论：后端此前**没有 Project 模型/模块**；项目数据来自 MSW 快照示例项目（p1..pN）+ `project-stages.ts` 的 localStorage overlay。本次做全栈落库，方案类比任务落库。
- 后端：
  - `prisma/schema.prisma` 新增 `model Project`（id 沿用前端项目 id，含 name/description/status/priority/dueDate String/memberIds/leadId/progress/archived/teamId/**stage**/**no**），`@@map("projects")`；迁移 `20261116020000_add_projects`（db push + migrate resolve）。
  - 新增 `src/modules/projects/`（CreateProjectDto / UpdateProjectDto / ProjectsService / ProjectsController，GET / GET:id / POST / PATCH / DELETE，写操作 MemberGuard），注册进 `app.module.ts`。
- 前端：
  - 新增 `src/api/projects/use-projects.ts`：`useProjects(includeArchived?)`（SWR）+ 独立 `createProject/updateProject/removeProject` API，写后 `globalMutate` 刷新 `/api/projects*`。
  - `use-workspace.ts` 数据源切换：新增 `useSWR("/api/projects")`，用后端项目替换快照里的 MSW 示例项目（`baseWithProjects.projects = dbProjects`）；`hydrateBackendProjects` 把后端项目的 stage/no 同步进本地缓存，使 `projectStage` / `projectNo` 保持同步读取。
  - `project-stages.ts` 项目生命周期写操作改为后端 API：`createProject`（POST，返回后端项目）、`updateProject`/`archiveProject`/`restoreProject`/`setProjectStage`（PATCH）、`deleteProject`（DELETE）；activity 时间线仍留 overlay 承载；`setProjectMembers` 复用 updateProject。
  - 调用点适配：`projects/index.tsx` 新建、`project-row-actions.tsx` 副本改为 `await` 后端返回。
- 验收：curl `POST/PATCH/DELETE /projects` 全通；前端新建项目后后端 projects 出现该行（含 stage `requirement`、no `#2611001`），两条预置任务同 projectId 落库；项目列表 `0 → 1 projects` 并显示「项目落库验证 #2611001 · …」；详情页标题/`Tasks (2)`/编号均正常。tsc 0 错误、lint 0 error、build 通过；测试数据已清理。
- 遗留说明：MSW 示例项目（p1..pN）已从列表移除（数据源切后端），存量 localStorage 项目不会自动迁移，需在后端重建；详情页子记录（issues/sprints/files/activities 等）仍由前端 overlay 承载，未在本轮范围。

### Demo 项目迁移 + 负责人 / 折叠 logo / 日期图标修复（2026-11-16）

- Demo 数据迁移：`use-workspace.ts` 增加一次性迁移 effect（`omnix-projects-migrated-v1` 标记 + `migratedRef` 防 StrictMode 重复），把 MSW 快照项目与 localStorage 存量项目（Test0001 等）批量 `POST /api/projects`，阶段/编号从 overlay 的 `stages/nos` 取（无则用 `STAGE_KEYS[index]` / `projectNo` 兜底）；迁移前按 id 跳过后端已有项目，避免多浏览器重复迁移主键冲突。实测后端 projects 从 0 → 17，前端列表同步显示。
- 负责人名称：`constants.ts` 的 `CURRENT_USER_ID` 由 `u2`（Bob Smith）改为 `u1`（Alice Johnson）——登录账号 alice@pms.com 与个人资料维护的 Alice（admin）一致，快照 u1 即 Alice；迁移时把历史写入的 `leadId: u2` / `memberIds` 里的 u2 同步修正为 u1。实测列表负责人全部显示 Alice。
- 折叠态 logo：`FullLogo.tsx` 折叠图标补 `shrink-0 object-contain`——原 `size-7` 容器用默认 `object-fit: fill` 把 309×172 的宽图拉成 28×28，视觉上被压扁；改为等比 contain 后 28×28 容器内保持宽高比居中。
- 截止日期图标：`pms.tsx` 的 `PmsDate` 里 `Clock` 补 `shrink-0`、文本补 `truncate`。根因是 flex 容器空间不足时 SVG 被压缩（实测同一 `size-3.5` 图标宽度从 14px 被挤到 1–8px、高度仍 14px），修复后全部 14×14，与 Test0001 行一致。
- 验收：tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；截图核对折叠 logo 完整、负责人 Alice、图标统一。

### 收起侧边栏 hover 不展开 + 项目优先级下拉 + 示例数据全部清除（2026-11-16）

- 收起侧边栏 hover 不展开：
  - 【真正根因】`css/globals.css` 第 262–346 行的 `[data-sidebar-type="true"] [data-slot="sidebar"][data-collapsible="icon"]` 内有一段 `.sidebar-box:hover { width: 250px !important; ... .hide-menu { display:flex !important } }`——这是从 shadcndashboard demo 复刻来的 hover-preview 浮层：侧边栏是 `position:fixed; z-10; bg-sidebar` 容器，hover 时被撑到 250px 并强制显示所有 `.hide-menu` 文字，于是「带白色背景的浮层」盖住右侧内容区。开关是 `CustomizerContext.tsx` 第 161 行 `root.setAttribute("data-sidebar-type", String(state.isCollapse))`，纯 CSS 驱动、无 JS 展开逻辑。
  - 修复：删除整段 `.sidebar-box:hover` 规则（含内部对 sidebar-container/sidebar-inner 宽度、`.hide-menu` 显隐、menu-button 对齐的所有 `!important` 覆盖）；把仅剩的图标居中规则从 `.sidebar-box:not(:hover)` 改为恒常 `.sidebar-box`，保留收起态「隐藏文字 + 图标居中」。`nav-items/index.tsx` 的 `onMouseEnter` 只是 hover 高亮圆角背景（正常反馈），与浮层无关，保留。
  - 【前次遗漏】之前只改了 `nav-collapse/index.tsx` 分组标题 `isCollapse ? "..." : ...`，那只是分组标题，不是浮层根因，问题依旧——本次从 CSS 层彻底去掉。
  - 验收：收起态（`.sidebar-box` 宽 70px、`.hide-menu` display:none），hover 侧边栏后宽度仍 70px、文字仍 none，不再弹白色浮层；截图确认侧栏恒为单列图标。tsc/lint/build 全过、0 console error。
- 项目优先级下拉：`projects/index.tsx` Priority 列改为 `DropdownMenu`（`aria-label="Priority: {priority}"`），Urgent/High/Medium/Low/None 降序带图标与颜色、当前项打勾；点选调 `updateProject(id, { priority })` 写入后端。实测点 Test0001 的 Medium→Urgent，`PATCH /projects/:id` 后 DB `priority=urgent`、前端标签同步（测试数据已恢复 medium）。
- 示例数据全部清除（审计 + 落地）：
  - 删除 `api/workspace/workspace-data.ts`（1664 行 MSW 示例快照）及 `mock-handlers.ts` 的 `WorkspaceHandlers` 注册；`/api/workspace/snapshot` 不再请求。
  - `use-workspace.ts` 数据源收敛：项目 `/api/projects`、用户 `/api/auth/users`（`avatarUrl→avatar`、`role/status` 映射成 `WsUser`）、任务 `/api/tasks`；子记录只来自本地 overlay 的用户自建内容。删掉一次性 demo 迁移 effect 与 `hydrateSeedProjects` 调用；`isLoading/error` 改为两个 SWR 合并。
  - 数据修复：迁移进库的 14 个项目 `leadId/memberIds` 仍是 MSW 假 id（u1~u8），真实后端用户是 CUID，导致负责人列全显示 `?`/`—`。一次性脚本按姓名 1:1 映射（u1 Alice / u2 Bob / u3 Carol / u4 David / u5 Eve / u6 Frank / u7 Grace / u8 Henry）批量改写 DB，tasks 表无假 id assignee。`CURRENT_USER_ID` 由假 id `u1` 改为 Alice 真实 CUID `cmwhzff3k000cpttzjn6rhh4i`；新建项目 `teamId` 由示例 `t1` 改为空。
  - 保留项：`SEED_TASKS`（新建项目预置的真实任务，写后端）、`getActiveProject()` 兜底 `p1`（已迁移为真实项目）非示例数据。
  - 验收：负责人列由 `?`/`—` 恢复为真实头像 + Alice/Carol 姓名；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；浏览器 0 console error、0 pageerror。

### 项目列表重复编号 / 头像裂图 / 负责人全名（2026-11-16）

- 重复编号 + 头像裂图（同一根因）：`project-stages.ts` 的 `mergeWorkspaceSnapshot` 把 `b.projects`（后端）+ `overlay.projects`（localStorage 遗留）直接拼接，且无去重。用户浏览器残留迁移前的旧项目（同名同编号、leadId 仍是 MSW 假 id u1/u2），于是 #2611016/#2611013/#2611012 各显示两次，重复行的负责人显示 `?`/`—`、头像裂图。
  - 修复：项目已 100% 落库，`overlay.projects` 纯属历史遗留且已无任何写操作新增（`createProject` 直接 `await apiCreateProject` 写后端）。`mergeWorkspaceSnapshot` 的 `projects` 改为只返回后端 `b.projects`（保留 `projectEdits` 覆盖与软删过滤），完全忽略 overlay.projects。
  - 头像裂图另因：seed 里 David Lee/Eve Wilson 的 `avatarUrl` 指向 `/images/profile/user-4.png`、`user-5.png`，但这两个文件缺失（返回 SPA HTML fallback → `<img>` 裂图）。已补齐两个 PNG（复制 user-9/user-10），并给 `pms.tsx` 的 `PmsAvatar` 加 `onError → initials` 兜底，任何坏 URL 都回退首字母而非裂图。
- 负责人全名：`projects/index.tsx` Lead 列由 `firstName(project.leadId)` 改为 `user(project.leadId)?.name ?? "—"`，完整显示 `Alice Johnson` / `Carol Davis` 等；移除未用的 `firstName` 解构。
- 验收：界面 13 个项目、13 个唯一编号、0 重复；注入模拟 overlay 残留后刷新仍 13 项 0 重复；负责人显示全名；页面 53 张图全部加载成功、0 裂图；tsc/lint/build 全过、0 console error。

### 项目操作栏完善 + 优先级「无」（2026-11-16）

- 复制反馈：`project-row-actions.tsx` 的 `copy()` 改为 async，成功 `toast.success(t("Link copied") / t("ID copied"))`、失败 `toast.error`；i18n 补两个词条。实测点「复制链接」「复制 ID」分别弹「链接已复制」「ID 已复制」。
- 「Move to」改为「标记为」：i18n `"Move to": "标记为"`。子菜单 Active/On hold/Completed 三态共用导出的 `STATUS_ITEMS`，进行中(active) 图标由灰色改 `text-blue-500` 蓝色；列表行首 icon 改由 `statusVisual(project.status)` 按状态渲染（active 蓝色 CircleDot / on_hold 琥珀 PauseCircle / completed 绿色 CircleCheck），截图核对进行中行蓝色⊕、已完成行绿色✓。
- 创建副本：`${project.name}${t("CopySuffix")}`，i18n `CopySuffix`= en " copy" / zh " 副本"（en 显式声明避免带空格 key 回退成字面）。实测「Test0001」→「Test0001 副本」，后端落库 12→13 并自动跳详情页（测试数据已删除恢复）。
- 其余功能审计：在新标签页打开 / 打开项目 / 标记为已完成 / 归档 / 删除均调用后端 CRUD（`updateProject`/`archiveProject`/`deleteProject`，内部 `revalidateProjects` 刷 SWR），功能完整；本次为状态切换/标记完成/归档/删除补 `toast.success(t("Saved successfully"))` 反馈。
- 优先级「不分组」→「无」：优先级下拉的 none 项此前 label 为 `t("None")`="不分组"（与 GROUP BY 的 None 共用 key），改为 label `"none"`，并在 i18n en 显式声明 `"none": "None"`、zh 复用已有 `"none": "无"`；项目页与任务页的单元格显示也针对 `priority==="none"` 走 `t("none")`。GROUP BY 的 `"None"="不分组"` 保持不变。
- 验收：菜单文案「复制链接/复制 ID/标记为/创建副本/标记为已完成/归档项目/删除项目」齐全；两个 toast、副本落库、蓝色 icon、优先级「无」均实测通过；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 团队概念移除 + 日期语义调整 + 看板卡片 + 删除 toast（2026-11-16）

- 列控制菜单：`projects/index.tsx` 的 `columnsMenu` 删除置灰的 `<DropdownMenuCheckboxItem disabled>{t("Completed")}</DropdownMenuCheckboxItem>`，菜单现只有 Lead/Members/Progress/Priority/Order date。
- 团队概念移除：① `sidebaritems.ts` 删除 Workspace 的 Team 导航项 + `UserRound` 导入；② `Router.tsx` 移除 TeamPage 懒加载与 `/team` 路由；③ 删除孤儿团队页 `views/workspace/team/index.tsx` 与 `create-dialogs.tsx` 的 `NewTeamDialog`/`NewTeamValues`；④ 项目模块清团队字段：`index.tsx` 的 GROUP_BY 去 Team + 删团队分组分支、`detail.tsx` 删 team 变量/展示行/`teams` 传参、`edit-archive-dialogs.tsx` 删 teamId 表单与 WsTeam 类型、`project-stages.ts` 的 createProject 不再写 teamId。后端 `Project.teamId` 列与类型定义保留（数据兼容，无 UI 入口）。
- 日期语义：`dueDate` 字段承载「下单日期」（订单阶段开始日期），`createdAt` 为「开始日期」。列表表头/COLUMN_MENU/SORT_BY 的 "Due date" → "Order date"，列值改为直接显示下单日期（去掉「剩余天数」）；详情页 Started=createdAt、Due date→Order date、Time left→Duration（持续时间= 下单日期−创建日期 的天数）；看板卡片日期用下单日期 + 创建时刻。i18n 补 `Order date`=下单日期、`Duration`=持续时间。说明：阶段进入时间未持久化，故用可编辑的 dueDate 作为下单日期，未新增 DB 迁移。
- 看板卡片：`projects/index.tsx` 看板卡片重做为「项目名 + 状态胶囊（STATUS_BADGE 蓝/琥珀/绿）+ 下单日期·创建时刻 + 负责人头像」，删除每张卡片底部的 `+ Add Task` 按钮（阶段看板不支持添加任务）。截图核对与提供样图一致。
- 删除/归档 toast 规范：`toast.ts` 的 DETAIL_KEYS 新增 `Project deleted/项目已删除`、`Project archived/项目已归档` 及各自描述；i18n 同步补键；`project-row-actions.tsx` 删除项目由 `t("Saved successfully")` 改为 `t("Project deleted")`、归档改为 `t("Project archived")`。审计全项目 toast：删除类仅此一处误用，已修正；联系人删除/成员移除本就规范。
- 验收：列菜单无 Completed 置灰项；侧栏无团队；详情显示「开始日期/下单日期/持续时间」、无「剩余时间/团队」；看板 12 卡片全带头像+状态胶囊、无 Add Task；删除临时项目弹「项目已删除」+ 删除专用描述（非保存成功），已清理测试数据；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 右上角个人信息：Sheet 侧弹 → shadcn Dropdown block（2026-11-16）

- 项目结构已满足：shadcn base-nova（`components.json` aliases `@/`→`src/*`，`src/*`→`src/*`）、React 19、Tailwind 4、TypeScript 6（覆盖要求的 5+）；`components/ui/avatar.tsx`、`dropdown-menu.tsx` 与 `tw-animate-css` 已就位，无需 CLI 安装依赖。
- 新建 block：`client/src/components/shadcn-dashboard/dropdown-menu/dropdown-menu-01.tsx`，完全按提供的代码 1:1 实现（圆角 2xl / w-3xs / 头像+在线绿点 / 三组菜单 / Signout 红色破坏性项），导入路径用项目别名 `@/components/ui/*`。为可复用做两点参数化：`user`（name/email/avatar/initials/online，默认沿用 David McMichael 演示数据）、`onSelect` + `labelOf`（默认原样英文，接入方可本地化）。额外导出命名组件 `Dropdown`。
- 替换侧弹：`header/Profile.tsx` 由 `Sheet` 右侧抽屉改为 `<Dropdown>`；接入真实 `useAuth()` 用户（name/email/avatarSrc/initials）、`myPresence==="online"` 控制绿点；`onSelect` 接真实行为——个人资料→`/profile`、账户设置→`/settings/general`、订阅/账单→toast「该板块暂未开放」、Signout→logout 后跳 `/login`。`labelOf={t}` 实现中英文菜单本地化，i18n 补 5 个 key。
- 未改动：动画 token（`--color-card`→`ring-card`、`w-3xs`、`data-open:*`）均为 Tailwind 4 + tw-animate-css 原生，全局 CSS 无需新增。
- 验收：截图核对下拉视觉与 block 一致；中英文菜单文案正确（个人资料/我的订阅/我的账单/账户设置/退出登录）；头像显示真实用户、在线绿点显示；点个人资料跳 `/profile`、Signout 跳 `/login`；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 在线绿点恢复 + Select-07 负责人 + 成员多选（2026-11-16）

- 在线绿点：上一轮换成 Dropdown 后，右上角 trigger 头像丢了旧 Sheet 里的 `AvatarBadge`，面板内绿点又被 Avatar 的 `after:` 伪元素遮挡。修复：trigger 头像补 `<AvatarBadge className={presenceStyles[myPresence].className} />`（青绿 10×10），block 面板绿点 span 加 `z-10`。浏览器实测两处绿点均显示。
- 新建 block：`client/src/components/shadcn-dashboard/select/select-07.tsx`，按提供代码 1:1（头像 + 名称、`User Context` 分组、当前项打勾），参数化 `users/value/onChange/label`，导出 `SelectUser` 类型。label 为空时不渲染 `<Label>`（供外层 FieldLabel 接管）。
- 编辑项目弹窗（`edit-archive-dialogs.tsx`）三项调整：
  - 日期语义：`Due Date` 字段改为 `Order date`（下单日期，对应上一轮项目列表/详情的语义调整），id 同步改 `edit-project-order-date`。
  - 负责人：由纯文本 `RecordSelect` 改为 `SelectWithAvatars`（select-07），`toSelectUser` 把真实 WsUser 转成选项（头像 + 姓名）；删除不再使用的 `RecordSelect`。
  - 成员：由平铺 Checkbox 列表改为下拉多选 `MemberMultiSelect`——trigger 显示已选头像组（最多 5 +N），面板每项「左头像 + 名称、右角色（Admin/User/Viewer）」，复用 `DropdownMenuCheckboxItem`，Base UI 点击后菜单保持打开可连续多选。
  - 【关键坑】Base UI 的 `DropdownMenuLabel` 必须包在 `DropdownMenuGroup` 内，否则运行时抛 `MenuGroupContext is missing` 导致整页崩溃；Trigger 用 `render={<button/>}` 而非 Radix 的 `asChild`。
- 验收：截图核对三处视觉；负责人下拉每项带头像、当前项打勾；成员下拉 11 项左头像名称+右角色、点击 Bob Smith 后菜单仍开且选中 2 项、保存后后端 `memberIds` 为 Alice+Bob（测试数据已恢复）；Order date 标签正确；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 项目列表行成员组件 → avatar-11 block（2026-11-16）

- 新建 block：`client/src/components/shadcn-dashboard/avatar/avatar-11.tsx`，按提供代码 1:1（Tooltip 悬停显示姓名、AvatarGroup 头像堆叠、超出 +N 用 Popover 展示隐藏成员「左头像+名称、右角色」、无图回退首字母）。参数化 `members/visible/showHint/size`，导出 `AvatarMember` 类型；默认沿用 block 演示数据可独立使用。
- 替换列表行成员：`projects/index.tsx` 的成员列由 `PmsAvatarGroup` 改为 `<AvatarDemo members={membersOf(project)} visible={3} showHint={false} size="default" />`；`membersOf` 改为返回 `AvatarMember[]`（name/image/initials/role，来自真实 WsUser）。移除未用的 `PmsAvatarGroup` import。
- 【坑】block 的 `key={member.name}` 在项目成员含重名时触发 React duplicate key 报错（迁移遗留 p1 的 memberIds 出现两次 Alice）→ 改为 `key={name-index}` 消除警告；同时修复后端 p1 重复成员数据（4→3 且唯一）。
- 注：当前工作区表头已是 "Created"（非上一轮登记的 Order date），属外部状态，本次未回退。
- 验收：截图核对头像堆叠 + `+N` + Popover 隐藏成员列表视觉；Popover 实测显示「4 members / Grace Kim - admin」；console error 0；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过。

### 项目列表成员列尺寸/对齐 + 列宽微调（2026-11-16）

- 成员头像与负责人一致：`AvatarDemo` 由 `size="default"`（32px）改为 `size="sm"`（24px，与 `PmsAvatar` 默认 size-6 相同），`+N` 计数圈同档 size-6。
- 居左对齐：block 新增 `align?: "center" | "start"`，列表行传 `align="start"`（demo 仍默认居中）。
- 列宽：`PmsHeader`/`PmsRow` 新增可选 `titleW`（默认 `w-56 min-w-56`，其它列表页不受影响）。项目页首列 `TITLE_W = w-48 min-w-48`（224→192px）；Members 列 w-24→w-28 容纳 3 个 24px 头像；Progress w-36→w-32。
- 标题可读性：`PmsRow` 的标题由与描述平分 `truncate` 改为「标题 `shrink` 优先、描述 `flex-1 truncate` 让位」，项目名完整显示（Website Redesign / 测试我的第一个项目 等），Created 列日期保持完整（w-40）。
- 验收：截图核对成员头像 24px 与负责人一致、居左；项目名完整；Created 完整；issues/sprints 等共享列表页因 `titleW` 默认值不变而未受影响；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### avatar-11 成员头像组 Popover 中英文（2026-11-17）

- 问题：block 里 Popover 文案硬编码英文——「N members」「{role}（user 小写）」「Show N more members」「Hover a face to see who it is」，中文界面下未翻译。
- 修复：`avatar-11.tsx` 引入 `useTranslation`，四处接入 i18n——`t("{{n}} members", {n})`、role 首字母大写后 `t(...)`、`t("Show {{n}} more members", {n})`、`t("Hover a face to see who it is")`；人名是专有名词不翻译。
- i18n：en 新增 2 个插值 key 声明（`{{n}} members`、`Show {{n}} more members`），zh 新增 4 条（「{{n}} 位成员」「再显示 {{n}} 位成员」「悬停头像查看姓名」+ `User`=「普通成员」、`Editor`=「编辑者」）；Owner/Admin/Viewer 中文词条已存在（负责人/管理员/查看者）复用。
- 验收：英文界面 Popover「4 members / Henry Chen - User」，中文界面「4 位成员 / Henry Chen - 普通成员」，aria-label「再显示 1 位成员」；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 上传头像未应用到展示位（2026-11-17）

- 现象：上传新头像后，下方「头像」编辑区显示新图，但顶部「个人资料」卡片仍显示默认头像。
- 根因：`views/apps/shared.tsx` 的 `avatarSrc(path)` 只把路径取文件名 key 后查内置 `AVATARS` 字典（user-1~10），查不到就返回 fallback 默认图。上传的真实路径 `/uploads/<uuid>.png` 不在字典 → 所有用 `avatarSrc` 展示的地方都回退到默认图；只有编辑区用本地 `preview`（blob/真实 URL）才显示新图。
- 修复：`avatarSrc` 改为——空值返回 fallback；内置 key（user-N）仍映射本地资源（保持线上 fixture 路径映射）；其它路径（/uploads/...、data:、http...）直接原样返回，加载真实图。
- 链路确认无误：上传走 `/api/upload`（后端落盘 uploads/、返回 /uploads/xxx）→ `updateProfile` 写库 → `onSaved` → `updateUser` 更新 AuthContext；Vite 已反代 `/uploads` 到 :4000，后端 `express.static(/uploads)` 静态托管，上传 URL 可正常加载。
- 验收：Alice 上传的鸭子头图（DB 为 /uploads/483a1087-....png）现在在顶部卡片、编辑区、右上角导航头像三处一致显示，img naturalWidth=2048 加载成功、不再 fallback；此修复全局受益（导航/成员设置/联系人/邮件页的 avatarSrc 调用点）；tsc 0 错误、build 通过、0 console error。

### 侧栏 Setting/Documentation 整行可点击（2026-11-17）

- 问题：底部 Setting / Documentation 与仪表盘等菜单项交互不一致——原来 `<SidebarMenuButton>` 内嵌一个 inline `<Link>`，只有文字/图标区域可点，行内空白处点击无效。
- 修复：`NavUser.tsx` 改为 `SidebarMenuButton render={<Link to={item.url} prefetch="none" />}`（Base UI 的 render prop），让按钮本体就是 Link，并加 `w-full` 占满整行；去掉内层包裹 Link。结构现与仪表盘菜单项（Link 包 NavItem）一致：整行 div 均可点击跳转。
- 验收：实测 Setting 行右侧空白（x=220,y=650）点击跳 `/settings/general`、Documentation 行空白（x=226,y=683）点击跳 `/faq`；`<a>` 本身带 `data-slot=sidebar-menu-button`、宽 216px 高 34px；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过；唯一 console error 是登录墙 `/api/auth/me` 未登录 401（预期）。

### 新建项目去掉截止日期（2026-11-17）

- `new-project-dialog.tsx`：`NewProjectValues` 删除 `dueDate`，弹窗删除 Due Date 的 `<Field>`/`<DatePicker>`，移除 DatePicker import。
- `projects/index.tsx`：`create()` 不再透传 `values.dueDate` 给 `createStageProject`。
- `project-stages.ts`：`createProject` 的 dueDate 由 `extra?.dueDate || "RELATIVE_DAYS_PLUS30"` 改为 `extra?.dueDate ?? null`——新建不设截止/下单日期（未下单），仅创建副本时沿用原项目 dueDate。
- 语义：dueDate 现只承载详情页/看板的「下单日期」（订单阶段开始），新建时为空显示「—」、Duration 0d；列表用的是 Created 列（createdAt），不受影响。
- 验收：弹窗字段仅 Name/Description/Status/Priority，无 Due Date；实测创建「无截止日期测试」项目后端 `dueDate: null`、详情页 Order date=「—」、Duration=0d（测试数据已删除）；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 新建项目隐藏状态/优先级 + Button/toast 防抖 + toast 可关闭（2026-11-17）

- 新建弹窗隐藏 Status/Priority：`new-project-dialog.tsx` 删除两个 Select Field 与 STATUS_OPTIONS/PRIORITY_OPTIONS、`select` import；`NewProjectValues` 保留 status/priority，`EMPTY` 仍为 `active`/`medium`（进行中/中）作为创建默认值。弹窗现仅 Name/Description；实测创建项目后端 `status=active, priority=medium, dueDate=null`。
- toast 防抖 + 可关闭：`sonner/toast.ts` 的 `show()` 加 `recentToasts` Map——相同 tone+title 在 400ms 内重复触发复用原 id 不新增；`closeButton` 默认 `true`（可传 false 关闭）。实测连点两次「Copy ID」只弹 1 个 toast，且 toast 内有 `toast-close` 按钮。
- Button 防抖：`components/ui/button.tsx` 的 `Button` 加 `debounceMs` prop（默认 300ms，传 0 关闭），用 useRef 记录上次点击时间，窗口内重复 onClick 忽略。
- 【关键坑】`type="submit" form="..."` 的按钮：浏览器原生表单提交绕过 Button 的 onClick 防抖，连点仍会重复提交（实测连点创建出 2 个项目）。故在 `new-project-dialog.tsx` 的业务层 `submit()` 再加 `submitting` ref 锁（重复提交直接 return，1s 兜底释放防失败卡死）。复测连点两次 Create Project 只创建 1 个项目。
- 验收：弹窗仅 Name/Description；默认值 active/medium；toast 400ms 防抖 + x 关闭按钮；Button 300ms onClick 防抖 + 表单提交锁；测试数据已清理；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 可编辑成员组 + 详情实时计时器（2026-11-17）

- 扩展 avatar-11：`AvatarMember` 加 `id`；新增 `editable`（默认 false）、`allUsers`、`onChange` props。editable 时在头像组末尾加虚线圆圈「+」按钮，弹出 Popover 列出全部可选用户（左头像+名称、右角色、勾选框），勾选回调 `onChange(ids)`。列表行不传 editable（只读，无 + 按钮）；项目详情 Members 字段传 editable + allUsers=snap.users，onChange 走 `setProjectMembers(id, ids)` 写后端。实测勾选 Carol Davis 后 p1 成员 3→4 落库（测试数据已恢复）。
- Started → 创建日期：i18n `"Started"` 中文由「开始日期」改为「创建日期」。
- 详情持续时间：`duration-timer.tsx` 新建 `DurationTimer`——从 createdAt 实时 tick（每秒），展示「xx天xx时xx分xx秒」，逐位数字用 motion 的 AnimatePresence 纵向滚动（仿 shadcn 数字计时器）。天/时为 0 时隐藏对应段（如「19时05分01秒」），天数不补零、分秒补零。
- 【样式调整】初版数字用 `bg-muted/60 + font-mono` 方块，与详情行其它值（text-sm font-medium 无底色）不一致；改为继承父级字体、去掉方块背景，仅保留 `tabular-nums` + 滚动动画，视觉与「45% / #2611001 / Alice Johnson」一致。
- 验收：详情显示「19时05分01秒」且 2 秒后秒数从 24→27 实时跳动；0 天段不显示；字体与其它详情值一致；添加成员可勾选并落库；列表成员只读；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 详情负责人改为可下拉选择（2026-11-17）

- 新建 `lead-select.tsx`：`LeadSelect` 用 shadcn DropdownMenu（Base UI），触发器为头像 + 名称 + hover 箭头（`aria-label=t("Change lead")`），面板列出全部用户（头像 + 名称 + 角色，当前项打勾），点击项回调 `onChange(userId)`。
- `detail.tsx`：Lead 字段由纯展示 `PmsAvatar + 名字` 改为 `<LeadSelect users={snap.users} value={project.leadId} onChange={leadId => updateProject(id,{leadId}).then(toast)} />`；移除不再使用的 `lead` 局部变量（PmsAvatar 仍在任务/成员头像处使用，保留 import）。
- i18n 补 `"Change lead"`=更换负责人。
- 验收：截图核对下拉视觉（标签 + 头像 + 名称 + 角色 + 打勾）；实测切换 Alice Johnson→Bob Smith 后端 leadId 落库（已恢复 Alice）；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 阶段(Sprint)↔任务闭环 + 任务编号 #T001（2026-11-17）

- 审计结论：原 Sprint 只通过 `issueIds` 关联 Issue（非 Task）；`WsTask.sprintId`/后端 Task.sprintId 字段存在但前端从不读写；无任务编号。截图 `3/6 done · 50%` 效果原已存在于 detail.tsx 的 sprintCards，但数据源是 Issue。
- 【复用现有字段，不改数据库】采用 `task.sprintId` 作为关联维度：
  - 新建项目闭环：`projects/index.tsx` 的 `create()` 建项目后 `addSprint(projectId, {name:"Sprint 1", status:"active"})`，2 条预置任务创建时带 `sprintId: sprint.id`——阶段卡片立即同步任务进度。
  - 进度改按 Task：detail.tsx 的 `sprintTasks/sprintDone` + sprintCards 的 total/dots 改按 task.sprintId 统计；sprints/index.tsx 的 `progressOf/tasksOf`、Tasks 列、详情 Sheet 的任务列表同步改为按 Task（表头 Issues→Tasks）。完成判定统一 done/closed/completed。
  - 任务编号 `#T001`：新建 `task-no.ts` 的 `taskNo(task, allTasks)`——按 createdAt+id 排序的全局序号（Task 无 number 字段，展示层生成）。显示在 tasks 页任务标题前、sprint 卡片 dot title、sprints 页详情 Sheet 任务列表。
- 验收：实测新建「闭环测试项目」→ 2 条预置任务 sprintId 一致 → Sprint 卡片 `0/2 done · 0%`，把一条任务改 done 后刷新变 `1/2 done · 50%`；Sprint 详情显示 `#T018 梳理产品需求 done / #T017 建立客户画像 todo`；tasks 页 16 个任务显示 #T00x；测试数据已清理；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 修正：预置任务挂需求阶段 + 负责人截取名（2026-11-17）

- 背景：上一轮把 2 条预置任务挂在自动建的 "Sprint 1" 上是错的（用户截图指出）；正确是初始化 9 个阶段、需求阶段的 2 条任务挂在**需求阶段**下。
- 修正内容：
  - `projects/index.tsx` 的 `create()` 删除 `addSprint("Sprint 1")`，2 条预置任务 `sprintId = "requirement"`（阶段 key 作稳定标识，无需实体 Sprint）。
  - `detail.tsx` 的 `stageCards`（9 个固定阶段）由硬编码 `dots:[], done:0, total:0` 改为按 `dbTasks.filter(t => t.sprintId === stage.key)` 统计；需求阶段卡片显示任务彩色块 + 进度，其它阶段 0/0。`sprintCards` 仍按真实 Sprint 的 `s-new-xxx` id 过滤，与阶段 key 不冲突。
  - 负责人截取名恢复：`projects/index.tsx` 从 `useWorkspace()` 解构 `firstName`，Lead 单元格由完整 `user(id).name` 改为 `firstName(id)`（即 name.split(" ")[0]，中文名无空格则原样）。
- 验收：新建测试项目 → 2 条任务 sprintId=`requirement`、无 Sprint 1；详情 Sprints tab 9 阶段卡片，Requirement 显示 `0/2 done · 0%`，其它 0/0；任务改 done 后 Requirement 变 `1/2 done · 50%`；列表负责人显示 "Alice"（截取名）；测试数据已清理；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 删除项目级联删除任务（2026-11-17）

- 根因：Project 与 Task 仅通过字符串 `projectId` 关联（schema 无 `@relation`/外键级联），`ProjectsService.remove()` 原只 `prisma.project.delete`，任务变成孤儿数据。
- 修复：`server/src/modules/projects/projects.service.ts` 的 `remove()` 用 `prisma.$transaction([task.deleteMany({where:{projectId:id}}), project.delete({where:{id}})])` 在同一事务里先删任务再删项目，保证原子性。
- 验收：API 实测创建测试项目 + 2 任务 → DELETE 项目 → 项目消失且该项目下任务从 2→0（deleteStatus 200 / projectGone true / remainingTasks 0）；后端 watch 编译 0 errors；唯一 console error 是登录墙 `/api/auth/me` 未登录 401（预期）。

### 项目进度逻辑完善（2026-11-17）

- 根因：`mergeWorkspaceSnapshot` 的 `deriveProgress` 因 `patchProject(item, false)`（created=false）从不生效，进度完全来自后端静态 `project.progress` 字段（建项目写死 0，任务完成不联动）；且 snapshot 的 tasks/issues 恒为空，无法在 merge 层算。
- 口径：进度 = 已完成(任务+问题) / 总计(任务+问题)；两者都为 0 时 0%。完成状态统一 done/closed/completed。
- 实现：
  - 新建 `project-progress.ts` 导出 `projectProgress(projectId, tasks, issues)` 与 `projectCounts(...)`（总数/完成数）。
  - 列表 `projects/index.tsx`：引入 `useTasks()` 全局任务，`<PmsProgress>` 改为 `projectProgress(project.id, allTasks, snap.issues)`；看板卡片 map 加 `projectCounts`，total=0 时状态胶囊显示「未开始」灰底（i18n 补 `Not started`=未开始）。
  - 详情 `detail.tsx`：侧栏进度百分比/进度条改用 `projectProgress(id, dbTasks, snap.issues)`；Progress 说明文案从「x of y issues closed」改为「任务与问题共 N 项，已完成 M 项」。
- 验收：用户项目 2 条 todo → 列表进度 0%；一条改 done → 进度条 50%（已恢复）；空项目测试 → 0% 且看板显示「未开始」/Not started（测试数据已删除，用户项目保留）；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。

### 详情进度提醒上下滚动（2026-11-17）

- 需求：截图红框处「任务与问题共 N 项，已完成 M 项」改为上下滚动的进度提醒，文案重新组织、重点提醒进度。
- 实现：新建 `progress-ticker.tsx`——固定单行高度 `h-4 overflow-hidden`，用 motion `AnimatePresence` 做纵向进出（新文案从下进、旧的向上出），每 10s 轮播一条（初版 2.8s，按用户要求改为 10s）。文案按场景组织：有事项时 3 条（整体进度/任务与问题拆分/剩余提醒或全部完成），空项目 2 条（尚未开始/新建后跟踪）；中英双语。
- `detail.tsx`：Progress 区原静态 `<p>` 替换为 `<ProgressTicker done/total/doneTasks/totalTasks/doneIssues/totalIssues/progress/zh />`。
- 验收：截图确认单行展示不撑开布局；英文轮播「1 item remaining — keep going」→「Tasks 1/2 · Issues 0/0 resolved」，中文「整体进度 50% · 已完成 1/2 项」→「还剩 1 项待完成，继续推进」；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。轮播间隔后按用户要求从 2.8s 调为 10s。

### 隐藏阶段列表页导航（2026-11-17）

- `sidebaritems.ts` 删除 Workspace 组的 Sprints（阶段）导航项与不再使用的 `Zap` import，注释同步更新。仅隐藏入口，`/sprints` 路由与页面保留（项目详情的阶段卡片仍可进入）。
- 验收：侧栏 WORKSPACE 现为 Projects / Issues / Tasks / Calendar；无「阶段」/Sprints 入口；tsc 0 错误、lint 0 error（3 条既有 warning）；唯一 console error 是登录墙 `/api/auth/me` 未登录 401（预期）。

### 项目初始化：三阶段任务 + 角色经办人（2026-11-17）

- 审计发现：系统 `role` 仅 super_admin/admin/user/viewer，**无 design/purchase/engineering 角色**；但 `department` 有设计部（Carol Davis、Grace Kim）、技术部（Bob Smith、David Lee、Frank Brown）、销售部（Alice 等），**无采购部**。故「设计角色/工程角色」按部门匹配，「采购角色」因无采购部回退项目负责人。
- 种子任务重构：`project-stages.ts` 的 `SEED_TASKS` 由 2 条改为 24 条 `SeedTask`（带 `stage` + `assigneeRole`）：
  - 需求 stage=requirement：建立客户画像、梳理产品需求（2 条，lead）
  - 报价 stage=quotation：价格核算、发送报价、报价反馈（3 条，lead）
  - 样品 stage=sample：负责人 6 条（收取样品费用/下发设计单/设计确认/下发工程单/寄样/客户确认）、设计部 5 条（画图+渲染/安排3D打印/移交模具店/安排下缸/通知模种到厂）、采购 5 条（采购大货模/采购夹具/采购钢板/包装辅材采购/组装辅材采购）、工程部 3 条（安排打样/创建成品档案/创建成品装配清单）
- 创建流程：`projects/index.tsx` 引入 `useUsers()`（带 department），`assigneeOf(role)` 按部门关键词匹配（设计→设计部、工程→技术部、采购→回退 lead），任务 `sprintId=seed.stage` 挂对应阶段。
- 验收：实测新建项目创建 24 任务，byStage={requirement:2, quotation:3, sample:19}，byAssignee={Alice(销售部/lead):16, Carol(设计部):5, Bob(技术部):3}；详情阶段卡片显示需求 0/2、报价 0/3、样品 0/19；测试数据已删除（级联删除 24 任务归零），用户项目保留；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。
- 补充：经办人也勾进项目成员——`createProject` 的 `extra` 加 `memberIds`，`index.tsx` 的 `create()` 先算各任务的 assigneeId 去重后作为 memberIds 传入（createProject 内部再并上 CURRENT_USER_ID）。实测新项目 memberIds=[Alice, Carol, Bob]，24 任务的 assigneeId 全部在成员内、无多余成员。

### 任务阶段显示 + 待规划状态（2026-11-17）

- 背景：用户另一个任务负责隐藏 Issues/Tasks 导航入口，本轮不动侧栏（撤销了误恢复的 Issues/Tasks 导航，保持 Projects/Calendar 隐藏态）。
- 任务阶段：`tasks/index.tsx` 的 `stageOf(task)` 原返回**项目当前阶段**（导致所有任务显示"需求"），改为读任务自身 `task.sprintId`（STAGE_KEYS 校验，非法回退 requirement）；import 去掉 projectStage，加 STAGE_KEYS/StageKey。
- 待规划：`projects/index.tsx` 预置任务 status 由 todo 改为 `backlog`（中文 i18n「待规划」已存在）。
- 预估/到期不赋值：`server/src/modules/tasks/tasks.service.ts` 的 create 区分 undefined 与显式 null——undefined 仍按优先级/7 天补默认（保持其它入口行为），显式 null 则存 null；前端预置任务传 `dueDate:null, estimate:null`。
- 验收：实测新建项目 24 任务 byStage={sample:19,quotation:3,requirement:2}、全部 status=backlog、withDue=0、withEstimate=0；任务页阶段列正确显示需求/报价/样品；测试数据已删除；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、后端 Found 0 errors、0 console error。

### Coming up 动画任务列表（animated-list-03 block，2026-11-17）

- 新建 shadcn block `animated-list-03.tsx`（StackRipple）：motion AnimatePresence 做折叠态堆叠卡片 ↔ 展开态滚动列表切换；支持受控 open/onOpenChange、showToggle、showAllLabel/hideLabel、可选 time、tag。展开列表 `max-h-72 overflow-y-auto` 固定高度滚动；根容器与卡片去掉 max-w-xs 以撑满父列。
- `detail.tsx` 的 Coming up 区域由静态 `<ul>` 替换为 StackRipple：
  - 数据：全部任务按 createdAt **升序**（最早在前），每项图标按 `STAGE_ICON`（9 阶段各有 LucideIcon + 配色），描述为 `#Txxx · 经办人`，右侧 `tag` 为状态 badge（STATUS_COLOR + STATUS_LABEL）；卡片内不显示阶段文字。
  - Show All/Hide 按钮移到「Coming up」标题右侧（受控 `comingOpen`），`comingOpen ?? comingUpItems.length === 1` —— **只有 1 个任务时默认展开**、无切换按钮；>1 时才显示按钮。
- i18n 补 `Show All`=显示全部、`Hide`=收起。
- 验收：截图确认卡片撑满 Coming up 列、阶段图标带色、状态 tag、无阶段文字；6 任务折叠显示前 3（任务一二三）、点 Show All 展开全部 6 且固定高度可滚动（scrollHeight 392 > clientHeight 286）；单任务默认展开无按钮；任务按创建时间排序；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。
- 后续按用户要求改为**卡片默认展开**：`comingOpen` 初始值由 null（仅单任务展开）改为 `true`，按钮显示 Hide、全部任务默认展示，点 Hide 才收起为堆叠态。实测用户项目 2 任务默认全部展开、按钮为 Hide；tsc 0 错误、0 console error。
- 用户要求展开态去掉外边框：`animated-list-03.tsx` 展开容器 class 去掉 `rounded-xl border border-border`（保留 max-h-72 滚动与 bg/p-2），实测 computed borderWidth=0、borderRadius=0；卡片自身边框保留。tsc/build 通过。

### 阶段随任务自动流转 + 按阶段过滤展示（2026-11-17）

- 审计结论：原链路缺 4 环——①无「当前阶段任务全完成」判定 ②任务状态切换不触发流转 ③Coming up 用全部任务 ④任务列表无阶段过滤。`setProjectStage → PATCH /api/projects/:id → hydrate → projectStage` 写库链路本就通；无 per-stage 完成字段，用 `i < stageIndexOf(current)` 推导即可。
- 实现：
  - `use-tasks.ts` 新增 `maybeAdvanceStage(projectId)`：PATCH 任务成功后（仅 patch.status 变化时）调用——fetch 该项目 tasks + project，若当前 stage 的任务**非空且全部 done/closed/completed**，则 `nextStage(current)` 并 `PATCH /api/projects/:id {stage}`（最后一阶段封顶不推进、空阶段不推进），revalidate /api/projects + /api/tasks。try/catch 吞掉推进失败，不影响任务本身更新。
  - `detail.tsx` 的 comingUpItems 加 `.filter(task => task.sprintId === currentStage)`（保留并行任务的未完成过滤）——只展示当前阶段任务；阶段推进后自然显示下一阶段任务。
  - `tasks/index.tsx` 的 list 加 `task.sprintId === stageOfProject(task.projectId)`（从 snap.projects 的 stage 字段取），默认任务列隐藏其它阶段的初始化任务。
  - `WsProject` 类型补 `stage?: string`（后端有该字段，前端类型之前遗漏）。
- 验收：新建项目初始 stage=requirement、Coming up 只显示 2 条需求任务；需求任务在 UI 改完成后 stage 自动变 quotation、Coming up 切换显示报价 3 任务（发送报价/报价反馈/价格核算）；其它阶段任务在默认任务列隐藏；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。测试数据已清理（未动并行任务数据）。

### 阶段详情页 1:1 复刻（2026-11-17）

- 需求：项目详情点击阶段卡片（如需求阶段）跳转到阶段详情页，按用户提供的 demo 截图 1:1 复刻。
- 新建 `views/workspace/projects/stage-detail.tsx`：
  - Header：Sprints 标题 + 副标题「A 1-2 week period to finish a chosen set of issues.」+ 右上 All sprints / 阶段选择（Requirement）/ New sprint 三按钮。
  - 左侧分组表格：Issue / Status / Priority / Assignee 四列，按 In progress / To do / Done 分组（分组头含数量与 hint），任务显示标题+编号（taskNo）、状态 badge（点击切换 done/todo）、PmsPriority、负责人头像。
  - 右侧面板：阶段名 + Active/Done/Not started badge、Progress + 进度条、Day 8 of 15 · 7 days left、Project / Dates / Issues / Done / Goal、黑色 Complete sprint 按钮（仅当前阶段可点，点击 setProjectStage 推进下一阶段并回项目详情）。
- 路由：`Router.tsx` 加 `/projects/:id/stages/:stage`（lazy StageDetailPage）。
- 跳转：`detail.tsx` 阶段卡片 href 由 `/apps/invoice/edit/...?stage=xxx` 改为 `/projects/${id}/stages/${stage.key}`；移除不再使用的 noParam/projectNoParam。
- 类型：`WsProject` 补 `no?: string`（后端 Project.no）。
- 验收：截图与 demo 对照——布局/分组头/四列表格/右侧面板/黑色按钮一致；点击需求阶段卡片跳转到 `/projects/:id/stages/requirement`；阶段页显示 2 条需求任务、Progress 0%、Active badge；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、0 console error。
- 精修：登录线上 `pms-workspace-app.vercel.app/sprints?sprint=s1`（alice@pms.com/123456）实测 CSS 后校准：主容器 gap-5、两栏 gap-6 + items-start；表格加 bg-card，表头 14px/500/foreground、td px-3 py-3；分组头 12px 加粗词 + muted 说明；任务标题 14px/500（原 600）、编号 12px；状态 badge h20/圆角26/px-2/text-xs/500；右栏 lg:w-80（原 w-72）、外壳无样式、内部 panel `overflow-hidden rounded-xl border bg-card lg:sticky lg:top-20`、分区 padding 16px 20px / 字段行 12px 20px / 按钮区 20px；按钮 h8/圆角10/text-sm/500；进度条 track bg-teal-400/10 + indicator bg-primary。截图对比与线上高度一致；tsc/build 通过、0 console error。

### 阶段详情文案 + 完成阶段确认框 + 批量完成（2026-11-17）

- 文案：`All sprints`→`Back to project`/返回项目、`New sprint`→`New stage`/新建阶段、`Complete sprint`→`Complete stage`/完成阶段；副标题润色为「展示当前阶段的任务与问题，跟踪阶段进度。」/「View tasks and issues in the current stage and track its progress.」。i18n 补 4 条。
- 完成逻辑：`stage-detail.tsx` 的黑色按钮由直接执行改为打开 `AlertDialog`（标题=完成阶段，描述「是否标记为完成并解决当前阶段的所有任务和问题？确认后将批量完成任务并进入下一阶段。」/ 英文对应，取消/确认）。确认后 `handleComplete()`：批量完成当前阶段未完成任务 → `setProjectStage(nextStage)` → 回项目详情。
- 后端批量接口：`server/src/modules/tasks/dto/bulk-complete-tasks.dto.ts`（ids: string[]）+ `TasksController @Patch("bulk/complete")`（放在 `:id` 路由前避免冲突）+ `TasksService.bulkComplete()` 用 `prisma.task.updateMany({where:{id:{in:ids}}, data:{status:"done"}})`。前端 `use-tasks.ts` 导出 `bulkCompleteTasks(ids)`。问题模块尚未搭建，后续在此扩展。
- 验收：中英文文案均生效；点击完成阶段弹出确认框（截图核对）；实测确认后需求阶段 2 条任务全部变 done、项目 stage requirement→quotation、跳转回项目详情；并行任务项目数据已恢复原状；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、后端 0 errors、0 console error。

### 阶段详情去按钮 + 任务列表调整 + 预估到期规则（2026-11-17）

- 阶段详情：删除「新建阶段」按钮（原只是跳回项目详情的占位），移除 Plus import。
- 任务列表 `tasks/index.tsx`：
  - 项目详情内嵌（embedded）去掉「项目」列（headersFor(embedded) 过滤 + 条件 td + colSpan 动态 + Board 卡片隐藏项目名）。
  - 经办人文本由 userName（全名）改为 firstName（首名），头像仍用全名保留首字母缩写。
  - `currentStageOnly` 默认 false（默认展示所有任务，勾选框仅在 embedded 出现）。
  - create() 补传 values.dueDate（之前表单填写被丢弃）。
- 预估/到期规则：
  - 后端 `tasks.service.ts`：去掉 DUE_IN_DAYS=7；`defaultDueDate(estimate)` = 创建时间 + estimate 小时；create 先算 estimate 再算 dueDate；update 在预估变化且未显式传 dueDate 时联动到期 = 创建时间 + 新预估（ensureExists 改为返回 task）。优先级预估仍为 urgent:2/high:4/medium:8/low:12/none:24。
  - 前端：Estimate 列改为 DropdownMenu（2/4/8/12/24/48h 可选，显示按天 `Math.ceil(estimate/24)d`）；Due 列改为可编辑 `<input type=date>`（onChange 调 updateTask）；移除倒计时心跳 nowTick/useEffect；i18n 补 Estimate (hours)。
- 验收：阶段详情无新建按钮；项目详情 Tasks 默认显示 24 任务（全阶段混合）、表头无 Project 列、经办人显示首名、预估列显示 Xd；实测 high 优先级建任务→estimate 4h、到期=创建+4h，改 estimate=24→到期联动 +24h；tsc 0 错误、lint 0 error（3 条既有 warning）、build 通过、后端 tsc 0 错误、0 console error。测试数据已清理。

### 阶段卡片时间展示规则（2026-11-17）

- 需求：阶段卡片 subtitle 按阶段状态/类型差异化：
  - 各阶段默认天数 `STAGE_DAYS`：需求2/报价2/样品7/订单90/采购7/生产30/物流7；费用与售后为 null（贯穿整个业务阶段，**不展示时间，空字符串**）。
  - `stageTimeRange(stageKey, createdAt)`：以项目创建时间为起点，按 STAGES 顺序累加前序阶段天数，算出该阶段起止（无缝衔接，如需求结束日=报价开始日）。
  - subtitle 规则：费用/售后 → `""`；未开始阶段（i > 当前阶段索引）→ `tr("To be planned","待规划")`；需求/已完成/当前阶段 → `${fullDate(start)} – ${fullDate(end)}`。
  - 移除原来从 `getStageForm` 读 createDate/dueDate 的逻辑（及未使用的 getStageForm/stageFormKey import）。
- 验收：初始需求卡片显示「创建日 – 创建+2天」、报价/样品/订单/采购/生产/物流 显示 To be planned、费用/售后 为空；把项目 stage 推到 quotation 后需求保留原时间段、报价显示「需求结束 – +2天」、样品起仍 To be planned；数据已恢复；tsc 0 错误、lint 0 error、build 通过、0 console error。

### 日期持久化 + date-picker-02 block + 卡片高度对齐（2026-11-17）

- 新建 shadcn block `components/shadcn-dashboard/date-picker/date-picker-02.tsx`：DateRangePicker，触发器为**纯文字+日历图标+箭头**（无按钮边框）；用 Base UI Popover + react-day-picker（mode=single 自己管两段式）——第一次点选起点（弹层保持打开），第二次点晚于起点的日期才提交（onCommit）并关闭，点更早日期重设起点。支持 value/onChange/onCommit 受控。
- 阶段详情 `stage-detail.tsx`：用 DateRangePicker 替换原内联日历；`handleDateCommit` 把选中的起止写入 `saveStageForm(formKey, {createDate, dueDate})` 持久化（读也从 getStageForm，切阶段 useEffect 同步）；value 用 dateRange state。
- 阶段卡片 `detail.tsx`：subtitle 优先读持久化的 `getStageForm(stageFormKey(no, stage.key))` 的 createDate/dueDate，无则回退动态计算/待规划；费用/售后与无日期占位用 `\u00A0`（不换行空格）保持 `<p>` 行高，**卡片高度与其它无任务卡片一致**（实测均 157px）；有任务卡片高度因彩色块数量自然增加。
- 验收：date-picker block 在阶段详情显示日期+图标；实测连点两个日期（11→15）弹层全程保持打开、选完提交并显示 Nov 11–15、自动关闭；回项目详情阶段卡片显示持久化后的「2026年11月11日 – 2026年11月15日」；Expense/After-sales 空日期卡片与其它卡片等高（157px）；tsc 0 错误、lint 0 error、build 通过、0 console error。
- 后续调整：date-picker-02 补 `zh` prop——中文显示「11月17日 – 11月24日」（用项目 formatDate(ch,short)），英文「Nov 17 – Nov 24」；去掉 ChevronDown 下拉箭头，日历图标移到触发器**最右侧**；展开恢复双月日历（numberOfMonths=2）+ Popover align=end 右对齐；阶段详情传 zh={zh}。截图核对通过、0 console error。

### 项目详情就地编辑（去编辑按钮，2026-11-17）

- 需求：删除「编辑」按钮，把编辑功能落到对应文本上——点项目名改名称、描述空时显示「暂无描述」点击可编辑、点状态改状态、点优先级改优先级、点创建日期选日期；负责人/成员已有逻辑不动。
- 前端 `detail.tsx`：
  - 名称：h1 点击切 Input（Enter/blur 保存，Esc 取消）；描述：无内容显示 `t("No description")`=暂无描述，点击切 textarea（blur 保存、Esc 取消）。
  - 状态/优先级：badge 改为 DropdownMenuTrigger（**必须用原生 button 作 render**，用 span 会触发 Base UI 无障碍警告），选项来自 STATUS_ITEMS / `[none,low,medium,high,urgent]`，选中打勾；点击调 `saveField()` 单字段 PATCH + toast。
  - 创建日期（侧栏 Started）：`<input type="date">`，onChange 调 saveField({createdAt})。
  - 删除 Edit 按钮与 `<EditProjectDialog>` 渲染；新增 saveField/commitName/commitDesc helper。
  - i18n 补 Click to edit。
- 后端：UpdateProjectDto 加 `createdAt?: string`（@IsDateString）；ProjectsService.update 写 `createdAt: new Date(dto.createdAt)`；前端 ProjectInput 加 createdAt。
- 验收：实测点名称→input→改值落库、状态下拉三项、优先级下拉、创建日期改值落库（createdAt 变 2026-11-10）；数据已恢复；发现并修复 Base UI「非 button 作 DropdownMenuTrigger」警告；tsc 0 错误（前后端）、lint 0 error、build 通过、0 console error。

### 内联编辑 shadcn 风格重构 + 日期组件属性化/本地化 + 配色统一（2026-11-17）

- 探查 shadcndashboard.dev/components：有 `Input 24 - Inline Edit`（Label + 输入框 + helper），无「纯文本+下划线」变体；按用户要求保留 contentEditable 交互，视觉对齐 shadcn 规范。
- 新建 `components/shadcn-dashboard/input/inline-edit.tsx` 替换旧 inline-editable.tsx（已删）：点击保持原文本样式、底部 `border-b-2 border-ring/50` 灰线、focus ring 用 shadcn `ring-3 ring-ring/20`、hover `bg-accent/60`；blur/Enter 保存、Esc 取消；用 `key=editing?"editing":"view"` 让 React 管理内容，不手动改 DOM。
- **暂无描述占位**：用 CSS `empty:before:content-[attr(data-placeholder)]` 灰色伪元素——编辑态清空后依然可见、不进 DOM/textContent（不会被误保存）、可再次点击编辑；detail.tsx 用 `placeholder={t("No description")}`。
- date-picker-02：`single` 属性控制单框（`numberOfMonths={1}`，项目详情创建日期）/ 双框（`numberOfMonths={2}`，阶段详情日期范围）；`zh` 时给 Calendar 传 `locale={zhCN}`（date-fns/locale），中文显示「2026年11月 / 一 二 三…」；英文走原格式。
- 配色统一：状态 tag 新增 `STATUS_TONE_BADGE`（active 蓝/on_hold 琥珀/completed 绿），与 STATUS_ITEMS.icon 的 tone 同色；优先级 PRIORITY_BADGE 改为与 PRIORITY_META.color 一致（medium 从 sky 改 amber、low 从 slate 改 sky），badge 文字色=icon 色，背景同色 10%。
- 列表：无描述时 `description={noOf(project)}`（不追加「 · 」）。
- 验收：截图核对状态/优先级 tag 与 icon 色值完全相同（computed color 一致）；编辑态清空后伪元素仍显示「暂无描述」且可再次编辑、输入保存落库；项目详情日期单月中文、阶段详情双月中文；tsc 0 错误、lint 0 error、build 通过、0 console error。

### 关闭 Blog/Notes/Ticket 模块（保留 MSW/Inbox，2026-11-17）

- 背景：用户明确 blog / notes / ticket 项目内不需要展示，关闭；inbox 保留（后续功能完善后再删）。**MSW 整体保持启用**（main.tsx 的 worker.start 不动）。
- 改动：
  - `api/mocks/handlers/mock-handlers.ts`：移除 Bloghandlers / NotesHandlers / TicketHandlers，只留 onlineContractHandlers + InboxHandlers。
  - `api/mocks/handlers/online-contract.ts`：移除 `/api/notes`、`/api/ticket`、`/api/blog` 契约端点及对应 fixture import，只留 `/api/email`、`/api/chat`。
  - `routes/Router.tsx`：删除 Blog(5 路由)/Notes(1)/Ticket(2) 的 lazy import 与路由表项。
  - `sidebaritems.ts`：删除 Apps 组的 Notes / Blogs / Tickets 导航项及未用的 NotebookText / BookOpen / Ticket icon import。
- 页面/context 源文件保留（路由已关，不会加载、不会 fetch），后续需要可恢复。
- 验收：侧栏 Apps 只剩 Contacts/Setting/Documentation；`/apps/notes` 跳 404；`/inbox` 正常访问且 `/api/inbox/notifications` mock 返回 200；tsc 0 错误、lint 0 error、build 通过、0 console error。

### 阶段详情进度条配色 + 列表/进度 i18n（2026-11-17）

- 进度条：indicator 由 `bg-primary` 改为 `bg-teal-500`（亮青绿，匹配用户截图），track 保持 `bg-teal-400/10`；百分比文字由 `text-blue-500` 改为 `text-foreground`（截图为深色）。
- i18n 补词条（en/zh）：`In progress`/进行中、`being worked on or in review`/正在处理或审核中、`To do`/待办、`not started yet`/尚未开始、`finished`/已完成、`Day 8 of 15 · 7 days left`/第 8 天，共 15 天 · 剩余 7 天、`No issues`/暂无任务。表头 Issue/Status/Priority/Assignee 与分组 title/hint 原本已用 t() 包裹，补词条后即生效。
- 验收：computed 颜色 indicator=oklch(0.704 0.14 182.503)（teal-500）、track=teal-400/10，截图与用户给的截图一致；中文界面表头/分组/进度/天数/目标/按钮全中文；tsc 0 错误、lint 0 error、build 通过、0 console error。

### 阶段详情任务化 + 日期同步 + 进度提示同步（2026-11-17）

- 任务化：阶段详情列表表头 `Issue`→`Task`、空状态 `No issues`→`No tasks`、右侧计数 `Issues`→`Tasks`；副标题与完成确认框文案由「任务与问题」统一为「任务」。i18n 补 No tasks。
- 日期同步：把 `STAGE_DAYS`/`STAGE_NO_TIME`/`stageTimeRange()` 从 detail.tsx 提取到 `project-stages.ts` 导出（两个页面共用）；阶段详情 `resolveRange()` 改为「优先 stageForm 持久化日期，无则按 stageTimeRange 推算」——与项目阶段卡片同一口径；费用/售后无日期。
- date-picker-02 修正：去掉 `value ?? 默认 now~now+7` 的回退（外部传空就是空，费用阶段日期为空）；改为受控 value 用 useEffect 按时间戳同步内部草稿（避免新对象引用导致循环）。
- 进度提示同步：`progress-ticker.tsx` 文案全部去掉「问题/issues」——「暂无任务」「当前阶段 X/Y 项任务已完成」「还剩 N 项任务」「Overall progress... tasks done」。
- 验收：阶段详情表头 Task、无 Issue；阶段详情日期 Nov 17–19 与项目卡片 2026年11月17日–19日一致；费用阶段日期为空；进度跑马灯三条文案中英文均无 issues/问题（实测轮播 10s 间隔）；tsc 0 错误、lint 0 error、build 通过、0 console error。

### 阶段详情进度提示按日期动态计算（2026-11-17）

- 需求：阶段详情进度提示由硬编码「第8天/共15天/剩余7天」改为按阶段日期时间段动态展示「今天距开始多少天 / 共几天 / 剩余几天」。
- 实现（`stage-detail.tsx`）：用 date-fns `differenceInCalendarDays` 计算——`total = days(to,from)+1`、`sinceStart = days(today,from)`、`left = days(to,today)`；三种情况：未开始 `Starts in N days`、已结束 `Ended`、进行中 `{{d}} days since start · {{total}} days total · {{left}} days left`；费用/售后无日期时提示为空。i18n 三条中英文词条（中文「距开始 {{d}} 天 · 共 {{total}} 天 · 剩余 {{left}} 天」）。
- 验收：需求阶段日期 Nov 17–19、今天 11-17 → 英文 `0 days since start · 3 days total · 2 days left`、中文「距开始 0 天 · 共 3 天 · 剩余 2 天」；tsc 0 错误、lint 0 error（3 既有 warning）、build 通过、0 console error。

### 阶段详情任务→事项文案（2026-11-17）

- 需求：阶段详情中展示的「任务」统一改为「事项」（仅阶段详情，不影响项目详情/任务页）。
- 改动：`stage-detail.tsx` 副标题（`View items...` / 展示当前阶段的事项）、表头 `t("Item")`、空状态 `t("No items")`、右侧计数 `t("Items")`、完成确认框文案（批量完成事项），注释同步。i18n 补 `Item`/`Items`/`No items`（中文 事项/事项/暂无事项）。
- 验收：英文界面副标题/表头为 items、无 Task 字样；中文界面为「事项」、无「任务」字样；tsc 0 错误、lint 0 error、build 通过、0 console error。

### Issue 落库 + 阶段详情 Add Issue/Add Task（2026-11-17）

- 审计结论：Issue 原本**没有后端**——无 schema model、无 issues module/controller/service/dto、无 `/api/issues`；前端 `snap.issues` 恒为空基线，实际来自 localStorage overlay，`addIssue()` 只写本地。Task 落库链路完整（createTask + sprintId）。
- 问题落库方案（新建 Issue 后端）：
  - Prisma `model Issue`（id/number/title/description/status/priority/severity/assigneeId/sprintId/projectId/createdAt/updatedAt，索引 projectId+sprintId）+ migration `20261117030000_add_issues` + prisma generate。
  - 后端 `modules/issues/`（dto: create/update/bulk-complete；service: list(projectId,sprintId)/create/update/bulkComplete/remove；controller: GET/POST/PATCH bulk/PATCH :id/DELETE）+ app.module 注册 IssuesModule。
  - 项目删除事务加 `issue.deleteMany({projectId})` 级联删问题。
  - 前端 `api/issues/use-issues.ts`（createIssue/updateIssue/bulkCompleteIssues/useIssues）；NewIssueDialog 加 defaultProjectId。
- 阶段详情 UI：列表底部加「+ Add Issue」「+ Add Task」按钮（复用 NewIssueDialog/NewTaskDialog，defaultProjectId=id）；提交时分别 `createIssue({projectId:id, sprintId:stageKey, number:max+1})` 和 `createTask({projectId:id, sprintId:stageKey})` 落库；列表渲染 `useIssues(id,stageKey)` 的 issue 行（#number/状态/优先级/经办人）；阶段完成 `handleComplete` 一并 `bulkCompleteIssues` 批量完成问题。
- 验收：实测 Add Issue→后端 `/api/issues` 返回记录（number=501/sprintId=requirement/status=backlog）、列表显示「Issues 1 · Open issues」+该问题；Add Task→后端 `/api/tasks` 记录 sprintId=requirement/status=todo；bulk-complete API 实测问题 status→done；测试数据已清理；tsc 0 错误、lint 0 error（3 既有 warning）、build 通过、后端 tsc 0 错误、0 console error。

### 经办人 none → 未指派（2026-11-17）

- 需求：项目/经办人为空时统一显示「未指派 / Unassigned」，不显示 none / — / ?。
- 改动：
  - `create-dialogs.tsx` Event 弹窗：`noneLabel={t("none")}` → 经办人 `t("Unassigned")`、项目 `t("Select a project")`；全仓库已无 `t("none")`。
  - `use-workspace.ts`：`firstName` 回退由 `—` 改为 `isZh ? 未指派 : Unassigned`（与 userName 一致）。
  - `stage-detail.tsx`：issue/task 行无经办人时由 `?` 圆形占位改为 `t("Unassigned")` 文字。
- 验收：实测创建无经办人任务，阶段详情列表显示 `Unassigned`（中文界面为未指派）；项目列表无 none 显示；tsc 0 错误、lint 0 error、build 通过、0 console error。

### 项目详情 Issues tab 改读后端（2026-11-17）

- 问题：Issue 已落库后端 `/api/issues`，但 `IssuesPage` 与项目详情仍读 `snap.issues`（localStorage overlay 恒为空），导致 Issues tab 列表不显示、tab 计数为 0。
- 改动：
  - `issues/index.tsx`：`all` 改用 `useIssues(projectId)`（后端）；`create()` 改用 `createIssue()`（不再写 localStorage）；`labelIds` 访问加 `?? []` 兼容后端缺字段；加载态加 issuesLoading。
  - `detail.tsx`：加 `useIssues(id)` → `dbIssues`；`data.issues`、`projectProgress`、`nextIssueNumber` 全部由 `snap.issues` 改用 `dbIssues`；data useMemo 依赖加 dbIssues。
- 验收：项目详情 Issues tab 计数 `Issues (1)`（与实际后端问题数一致）、列表显示问题行 #501；tsc 0 错误、lint 0 error（3 既有 warning）、build 通过、0 console error。
