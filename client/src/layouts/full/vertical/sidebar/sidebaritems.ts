export interface ChildItem {
  id?: number | string;
  name: string;
  icon?: LucideIcon;
  items?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
  isActive?: boolean;
  external?: boolean;
  isPro?: boolean
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: number;
  to?: string;
  item?: MenuItem[];
  items?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  badgeContent?: string;
  isActive?: boolean;
  isPro?: boolean
}

import { uniqueId } from "lodash";

import {
  Bell,
  CalendarDays,
  Contact,
  Layers,
  LayoutGrid,
  List,
  LucideIcon,
  Mail,
  MessageCircle,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react"

/**
 * 导航结构（参考 PMS Workspace 复刻）：
 * - Home：Dashboard / Inbox / Chats（Inbox 在聊天上方，PMS Home 组口径）
 * - Workspace：Projects / Calendar（Issues / Tasks / Sprints 入口按各自任务隐藏，路由保留）
 * - Apps：保留既有 Apps 模块（已移除 Chats、Calendar、Notes、Blogs、Tickets）
 * heading 使用英文 key，走导航层 i18n，英文界面不再硬显示中文。
 */
const SidebarContent: MenuItem[] = [
  {
    heading: "Home",
    items: [
      {
        id: uniqueId(),
        name: "Dashboard",
        icon: LayoutGrid,
        url: "/",
      },
      {
        id: uniqueId(),
        name: "Inbox",
        icon: Bell,
        url: "/inbox",
      },
      {
        id: uniqueId(),
        name: "Chat",
        icon: MessageCircle,
        url: "/apps/chats",
      },
    ],
  },
  {
    heading: "Workspace",
    items: [
      {
        id: uniqueId(),
        name: "Projects",
        icon: Layers,
        url: "/projects",
      },
      {
        id: uniqueId(),
        name: "Calendar",
        icon: CalendarDays,
        url: "/calendar",
      },
    ],
  },
  {
    heading: "Apps",
    items: [
      {
        id: uniqueId(),
        name: "Kanban",
        icon: List,
        url: "/apps/kanban",
      },
      {
        name: "AI",
        icon: Sparkles,
        id: uniqueId(),
        items: [
          { id: uniqueId(), name: "Chat", url: "/apps/chat-ai", isPro: true },
          { id: uniqueId(), name: "Image", url: "/apps/image-ai", isPro: true },
        ],
      },
      {
        id: uniqueId(),
        name: "Email",
        icon: Mail,
        url: "/apps/email",
        isPro: true,
      },
      {
        id: uniqueId(),
        name: "Contacts",
        icon: Contact,
        url: "/apps/contacts",
        isPro: true,
      },
      {
        name: "Requirements",
        id: uniqueId(),
        icon: Receipt,
        items: [
          {
            id: uniqueId(),
            name: "Requirement Edit",
            url: "/apps/invoice/edit/2611001",
          },
          { id: uniqueId(), name: "Requirement", url: "/apps/requirements/requirement" },
          { id: uniqueId(), name: "Quotation", url: "/apps/requirements/quotation" },
          { id: uniqueId(), name: "Sample", url: "/apps/requirements/sample" },
          { id: uniqueId(), name: "Order", url: "/apps/requirements/order" },
          { id: uniqueId(), name: "Expense", url: "/apps/requirements/expense" },
          { id: uniqueId(), name: "Purchase", url: "/apps/requirements/purchase" },
          { id: uniqueId(), name: "Production", url: "/apps/requirements/production" },
          { id: uniqueId(), name: "Logistics", url: "/apps/requirements/logistics" },
          { id: uniqueId(), name: "After-sales", url: "/apps/requirements/after_sales" },
        ],
      },
      {
        name: "User Profile",
        id: uniqueId(),
        icon: UserCircle,
        items: [
          {
            id: uniqueId(),
            name: "Profile",
            url: "https://demos.shadcndashboard.dev/apps/user-profile/profile",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "Followers",
            url: "https://demos.shadcndashboard.dev/apps/user-profile/followers",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "Friends",
            url: "https://demos.shadcndashboard.dev/apps/user-profile/friends",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "Gallery",
            url: "https://demos.shadcndashboard.dev/apps/user-profile/gallery",
            external: true,
            isPro: true,
          },
        ],
      },
      {
        name: "Ecommerce",
        id: uniqueId(),
        icon: ShoppingBag,
        items: [
          {
            id: uniqueId(),
            name: "Shop",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/shop",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "Details",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/detail/3",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "List",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/list",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "Checkout",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/checkout",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "Add Product",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/addproduct",
            external: true,
            isPro: true,
          },
          {
            id: uniqueId(),
            name: "Edit Product",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/editproduct",
            external: true,
            isPro: true,
          },
        ],
      },
      {
        id: uniqueId(),
        icon: Users,
        name: "Customers",
        url: "/react-tables/user-datatable",
        isPro: true,
      },
      {
        id: uniqueId(),
        icon: Package,
        name: "Orders",
        url: "/react-tables/order-datatable",
        isPro: true,
      },
    ],
  },
];

/** 应用模块后续再盘点：按用户要求仅放开 Contacts 入口，其余 Apps 项继续隐藏。 */
export default SidebarContent.map((section) =>
  section.heading === "Apps"
    ? {
        ...section,
        items: (section.items ?? [])
          .filter((item) => item.name === "Contacts")
          .map((item) => ({ ...item, isPro: false })),
      }
    : section,
);
