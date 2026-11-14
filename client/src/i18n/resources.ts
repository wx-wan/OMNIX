/**
 * 导航层中英文词典
 *
 * en 为空对象：英文是源语言，t(key) 未命中时原样回退到英文原文。
 * 中文只收录导航栏实际用到的文案（侧栏分组/菜单/子菜单、侧栏底部、
 * 顶栏搜索与通知/个人面板、面包屑、水平导航）。页面正文、footer 版权、
 * 通知示例数据、用户名与品牌名不属于导航层，保留英文。
 *
 * 翻译约定：
 *  - 技术专名与品牌保留原文，不音译（Shadcn / TanStack / React / API / AI）；
 *  - 菜单名用简短名词短语，不做逐词直译；
 *  - 与用户口径一致：仪表盘 / 分析 / 现代 / 应用。
 * keySeparator、nsSeparator 关闭，因为 key 含空格与点号。
 */
export const translations = {
  en: {},
  ch: {
    // 侧栏分组
    "Dashboard": "仪表盘",
    "DASHBOARD": "仪表盘",
    "Apps": "应用",
    "APPS": "应用",

    // 仪表盘
    "Analytics": "分析",
    "Modern": "主页",
    "Logistics": "物流",

    // 应用一级项
    "Notes": "笔记",
    "Blogs": "博客",
    "Tickets": "工单",
    "AI": "人工智能",
    "Calendar": "日历",
    "Chats": "聊天",
    "Email": "邮件",
    "Contacts": "联系人",
    "Invoice": "发票",
    "User Profile": "个人资料",
    "Ecommerce": "电子商务",
    "Kanban": "看板",
    "Customers": "客户",
    "Orders": "订单",

    // 子菜单（多个父级共用同一批词）
    "Blog Listing": "博客列表",
    "Blog Detail": "博客详情",
    "Blog Edit": "编辑博客",
    "Blog Create": "新建博客",
    "Manage Blog": "管理博客",
    "Chat": "聊天",
    "Image": "图像",
    "List": "列表",
    "Details": "详情",
    "Create": "新建",
    "Edit": "编辑",
    "Profile": "个人资料",
    "Followers": "关注者",
    "Friends": "好友",
    "Gallery": "相册",
    "Shop": "商店",
    "Checkout": "结账",
    "Add Product": "添加商品",
    "Edit Product": "编辑商品",

    // 侧栏底部
    "Setting": "设置",
    "Documentation": "使用文档",

    // 顶栏搜索
    "Search....": "搜索...",
    "No Components Found!": "未找到相关菜单",

    // 通知面板
    "Notifications": "通知",
    "new": "条未读",
    "See All Notifications": "查看全部通知",

    // 个人面板
    "Home": "首页",
    "Subscription": "订阅",
    "Account Settings": "账户设置",
    "Grab ShadcnDashboard Admin": "获取 ShadcnDashboard 管理模板",
    "Customize your dashboard": "自由定制你的仪表盘",
    "Log Out": "退出登录",

    // 水平导航分组
    "Ui": "界面",
    "Widgets": "组件",
    "Pages": "页面",
    "Forms": "表单",
    "Charts": "图表",
    "Tables": "表格",

    // 面包屑页面标题（BreadcrumbComp 的 title 也走 t()）
    "Tickets App": "工单应用",
    "Notes app": "笔记应用",
    "Blog app": "博客应用",
    "Form Elements": "表单元素",
    "Iconify Icons": "Iconify 图标",
    " Manage Blog": "管理博客",
  },
} as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ch", label: "简体中文" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["value"];

/** 旧版本可能持久化过 fr / ar；只认当前支持的两种语言。 */
export const isSupportedLanguage = (value: unknown): value is LanguageCode =>
  LANGUAGES.some((lang) => lang.value === value);
