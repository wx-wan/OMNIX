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
  // 英文以源语言回退为默认；仅带插值的模板必须在 en 显式声明，
  // 否则 t(key) 回退时会把 {{n}} / {{d}} 当成字面文本输出。
  en: {
    "N projects": "{{n}} projects",
    "N issues": "{{n}} issues",
    "N tasks": "{{n}} tasks",
    "N sprints": "{{n}} sprints",
    "N events": "{{n}} events",
    "N teams": "{{n}} teams · {{mine}} you belong to",
    "N people": "{{n}} people",
    "N live": "{{n}} live",
    "Day {{d}} of 15 · {{left}} days left": "Day {{d}} of 15 · {{left}} days left",
    "Starts in {{d}} days · 15 days long": "Starts in {{d}} days · 15 days long",
    "Finished {{date}} · 15 days long": "Finished {{date}} · 15 days long",
  },
  ch: {
    // 侧栏分组
    "DASHBOARD": "仪表盘",
    "Apps": "应用",
    "APPS": "应用",

    // 仪表盘
    "Analytics": "分析",
    "Modern": "主页",
    "Logistics": "物流",

    // 主页 / Workspace 导航（参考 PMS 复刻）
    "Workspace": "工作区",
    "Inbox": "收件箱",
    "Projects": "项目",
    "Issues": "问题",
    "Tasks": "任务",
    "Sprints": "迭代",
    "Team": "团队",

    // 业务工作区：九阶段 / 项目票号 / 需求模块
    "Stage": "阶段",
    "Stage flow": "阶段流",
    "Project No.": "项目编号",
    "Requirements": "需求模块",
    "Requirement Edit": "需求编辑",
    "Requirement": "需求",
    "Quotation": "报价",
    "Sample": "样品",
    "Order": "订单",
    "Expense": "费用",
    "Purchase": "采购",
    "Production": "生产",
    "After-sales": "售后",

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

    // Inbox 页面（UI 框架文案；通知正文数据保留英文）
    "All": "全部",
    "Unread": "未读",
    "Mentions": "提及",
    "Updates": "更新",
    "Unread Only": "仅未读",
    "Mark All As Read": "全部标为已读",
    "Find from your notifications...": "搜索你的通知...",
    "Mention": "提及",
    "Activity": "动态",
    "No notifications": "暂无通知",
    "just now": "刚刚",
    "d ago": "天前",
    "unread notifications": "条未读通知",
    "Sort By": "排序",
    "Actions": "操作",
    "Assignment": "指派",
    "View options": "视图选项",

    // 右栏详情 / 空态
    "No notification selected": "未选择通知",
    "Choose a notification from the list to view its details, comments and linked item.":
      "从列表中选择一条通知，查看其详情、评论与关联事项。",
    "mentioned you in this issue": "在此问题中提及了你",
    "Add sub-issue": "添加子问题",
    "Unsubscribe": "取消订阅",
    "created the issue": "创建了该问题",
    "Leave a comment...": "写下评论...",

    // View options 弹层
    "SORT BY": "排序",
    "SHOW IN EACH ROW": "每行显示",
    "INCLUDE": "包含",
    "LAYOUT": "布局",
    "Type label": "类型标签",
    "Message preview": "消息预览",
    "Time": "时间",
    "Read items": "已读条目",
    "Snoozed items": "稍后处理",
    "Activity updates": "动态更新",
    "Unread on top": "未读置顶",
    "Reset to default": "恢复默认",
    "Latest": "最新",
    "Earliest": "最早",
    "Most important": "最重要",
    "Sender A–Z": "发送者 A–Z",

    // ---- Workspace 六个模块（UI 框架文案；业务数据保留英文）----
    "Dashboard": "仪表盘",
    "Teams": "团队",
    "N projects": "{{n}} 个项目",
    "N issues": "{{n}} 个问题",
    "N tasks": "{{n}} 个任务",
    "N sprints": "{{n}} 个迭代",
    "N events": "{{n}} 个事件",
    "N teams": "{{n}} 个团队 · 你属于其中 {{mine}} 个",
    "N people": "{{n}} 人",
    "N live": "{{n}} 个进行中",

    // 视图与工具条
    "Board": "看板",
    "Month": "月",
    "Week": "周",
    "Day": "日",
    "Today": "今天",
    "New Project": "新建项目",
    "New Issue": "新建问题",
    "New Task": "新建任务",
    "New sprint": "新建迭代",
    "New team": "新建团队",
    "+ Add event": "+ 添加事件",
    "Filters": "筛选",
    "GROUP BY": "分组方式",
    "None": "不分组",
    "Recently updated": "最近更新",
    "Name (A–Z)": "名称 (A–Z)",
    "Number": "编号",
    "People": "人数",
    "Live projects": "进行中项目",
    "Founded": "成立时间",
    "Only my teams": "只看我的团队",
    "High priority": "高优先级",
    "Hide completed": "隐藏已完成",
    "Assigned to me": "指派给我的",
    "Add Issue": "添加问题",
    "View members": "查看成员",
    "Join team": "加入团队",
    "Joined": "已加入",
    "Delete team": "删除团队",
    "All teams": "所有团队",

    // 搜索占位符
    "Search projects...": "搜索项目...",
    "Search issues...": "搜索问题...",
    "Search tasks...": "搜索任务...",
    "Search sprints...": "搜索迭代...",
    "Search teams...": "搜索团队...",

    // 表头与字段
    "Project": "项目",
    "Lead": "负责人",
    "Members": "成员",
    "Progress": "进度",
    "Priority": "优先级",
    "Due date": "截止日期",
    "Issue": "问题",
    "Labels": "标签",
    "Status": "状态",
    "Assignee": "经办人",
    "Created by": "创建人",
    "Updated": "更新于",
    "Task": "任务",
    "Estimate": "预估",
    "Due": "到期",
    "Sprint": "迭代",
    "Dates": "日期",
    "Timing": "时间安排",
    "Name": "名称",
    "Title": "标题",
    "Description": "描述",
    "Goal": "目标",
    "Owner": "负责人",
    "Properties": "属性",
    "Milestones": "里程碑",
    "No description": "暂无描述",
    "No events": "暂无事件",
    "Events in range": "本周事件数",
    "Loading...": "加载中...",

    // 状态 / 优先级枚举
    "Active": "进行中",
    "Upcoming": "即将开始",
    "Completed": "已完成",
    "Backlog": "待规划",
    "Todo": "待办",
    "In Progress": "进行中",
    "Review": "评审中",
    "Done": "完成",
    "High": "高",
    "Medium": "中",
    "Low": "低",
    "Urgent": "紧急",
    "Unassigned": "未指派",
    "sprint": "迭代",
    "meeting": "会议",
    "milestone": "里程碑",
    "deadline": "截止",

    // 新建表单占位符
    "Project name": "项目名称",
    "What is this project about?": "这个项目是关于什么的？",
    "Issue title": "问题标题",
    "Describe the issue": "描述这个问题",
    "Task title": "任务标题",
    "Describe the task": "描述这个任务",
    "Sprint name": "迭代名称",
    "What should this sprint achieve?": "这个迭代要达成什么？",
    "Team name": "团队名称",
    "What does this team do?": "这个团队负责什么？",
    "Event title": "事件标题",
    "Event description": "事件描述",

    // Sprint Timing 模板
    "Day {{d}} of 15 · {{left}} days left": "第 {{d}} 天 / 共 15 天 · 剩 {{left}} 天",
    "Starts in {{d}} days · 15 days long": "{{d}} 天后开始 · 周期 15 天",
    "Finished {{date}} · 15 days long": "{{date}} 完成 · 周期 15 天",

    // PMS Workspace 1:1 线上工具条/枚举补齐
    "My projects": "我的项目",
    "Only my projects": "只看我的项目",
    "Created by me": "我创建的",
    "Show or hide columns": "显示或隐藏列",
    "Add Task": "添加任务",
    "On hold": "已暂停",
    "Hide done": "隐藏已完成",
    "Start date": "开始日期",
    "release": "发布",

    // 项目详情页 /projects/:id
    "Back to Projects": "返回项目列表",
    "Archive": "归档",
    "Overview": "概览",
    "Files": "文件",
    "Needs attention": "需要关注",
    "Overdue tasks and high-priority open issues": "逾期任务与高优先级未解决问题",
    "Key delivery dates": "关键交付日期",
    "Coming up": "即将到期",
    "Open tasks due in the next 14 days": "未来 14 天内到期的未完成任务",
    "Started": "开始日期",
    "Time left": "剩余时间",
    "Open issues": "未解决问题",
    "Tasks done": "已完成任务",
    "Member": "成员",
    "Role": "角色",
    "Open tasks": "未完成任务",
    "Admin": "管理员",
    "Viewer": "查看者",
    "Online": "在线",
    "Away": "离开",
    "Offline": "离线",
    "Closed": "已关闭",
    "Planning": "计划中",

    // 项目制写入：编辑、新建、归档与表单
    "Edit Project": "编辑项目",
    "Edit Issue": "编辑问题",
    "Edit Task": "编辑任务",
    "New Iteration": "新建迭代",
    "Edit Iteration": "编辑迭代",
    "Upload File": "上传文件",
    "Edit File": "编辑文件",
    "Add Member": "添加成员",
    "Add Note": "添加备注",
    "Add Milestone": "添加里程碑",
    "Save": "保存",
    "Restore": "恢复",
    "Archived": "已归档",
    "Show archived": "显示已归档",
    "End date": "结束日期",
    "File name": "文件名",
    "Type": "类型",
    "Message": "内容",
    "Select a member": "选择成员",
    "Cancel": "取消",

    // 新建项目弹窗（线上 PMS 1:1）
    "Due Date": "截止日期",
    "Create Project": "创建项目",
    "Create a new project for your team to work on.": "为团队创建一个新项目。",
    "On Hold": "挂起",
    "Website Redesign": "网站改版",
    "What's this project about?": "这个项目是关于什么的？",
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
