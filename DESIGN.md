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
