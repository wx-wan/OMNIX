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
  BookOpen,
  Calendar,
  ChartBar,
  Contact,
  House,
  List,
  LucideIcon,
  Mail,
  MessageCircle,
  NotebookText,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Ticket,
  UserCircle,
  Users,
} from "lucide-react"

/**
 * 侧栏只保留业务导航：Dashboard（分析 / 现代 / Logistics）+ 合并后的 Apps。
 * 原两个 Apps 分组已合并为一个；Pages、UI ELEMENTS、FORM ELEMENTS、
 * Widgets、Icons、Auth、Home、TABLES、Charts、PRO Pages 等模板演示板块已移除。
 */
const SidebarContent: MenuItem[] = [
  {
    heading: "Dashboard",
    items: [
      {
        id: uniqueId(),
        name: "Analytics",
        icon: ChartBar,
        url: "/dashboards/analytics",
      },
      {
        id: uniqueId(),
        name: "Modern",
        icon: House,
        url: "/",
      },
      {
        id: uniqueId(),
        name: "Logistics",
        icon: Package,
        url: "/dashboards/logistics",
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
        id: uniqueId(),
        name: "Notes",
        icon: NotebookText,
        url: "/apps/notes",
      },
      {
        name: "Blogs",
        id: uniqueId(),
        icon: BookOpen,
        items: [
          {
            id: uniqueId(),
            name: "Blog Listing",
            url: "/apps/blog/post",
          },
          {
            id: uniqueId(),
            name: "Blog Detail",
            url: "/apps/blog/detail/streaming-video-way-before-it-was-cool-go-dark-tomorrow",
          },
          {
            id: uniqueId(),
            name: "Blog Edit",
            url: "/apps/blog/edit",
          },
          {
            id: uniqueId(),
            name: "Blog Create",
            url: "/apps/blog/create",
          },
          {
            id: uniqueId(),
            name: "Manage Blog",
            url: "/apps/blog/manage-blog",
          },
        ],
      },
      {
        id: uniqueId(),
        name: "Tickets",
        icon: Ticket,
        url: "/apps/tickets",
      },
      {
        name: "AI",
        icon: Sparkles,
        id: uniqueId(),
        items: [
          {
            id: uniqueId(),
            name: "Chat",
            url: "/apps/chat-ai",
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Image",
            url: "/apps/image-ai",
            isPro: true
          },
        ],
      },
      {
        id: uniqueId(),
        name: "Calendar",
        icon: Calendar,
        url: "/apps/calendar",
        isPro: true
      },
      {
        id: uniqueId(),
        name: "Chats",
        icon: MessageCircle,
        url: "/apps/chats",
        isPro: true
      },
      {
        id: uniqueId(),
        name: "Email",
        icon: Mail,
        url: "/apps/email",
        isPro: true
      },
      {
        id: uniqueId(),
        name: "Contacts",
        icon: Contact,
        url: "/apps/contacts",
        isPro: true
      },
      {
        name: "Invoice",
        id: uniqueId(),
        icon: Receipt,
        items: [
          {
            id: uniqueId(),
            name: "List",
            url: "https://demos.shadcndashboard.dev/apps/invoice/list",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Details",
            url: "https://demos.shadcndashboard.dev/apps/invoice/detail/PineappleInc",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Create",
            url: "https://demos.shadcndashboard.dev/apps/invoice/create",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Edit",
            url: "https://demos.shadcndashboard.dev/apps/invoice/edit/PineappleInc",
            external: true,
            isPro: true
          },
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
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Followers",
            url: "https://demos.shadcndashboard.dev/apps/user-profile/followers",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Friends",
            url: "https://demos.shadcndashboard.dev/apps/user-profile/friends",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Gallery",
            url: "https://demos.shadcndashboard.dev/apps/user-profile/gallery",
            external: true,
            isPro: true
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
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Details",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/detail/3",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "List",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/list",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Checkout",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/checkout",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Add Product",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/addproduct",
            external: true,
            isPro: true
          },
          {
            id: uniqueId(),
            name: "Edit Product",
            url: "https://demos.shadcndashboard.dev/apps/ecommerce/editproduct",
            external: true,
            isPro: true
          },
        ],
      },
      {
        id: uniqueId(),
        icon: Users,
        name: "Customers",
        url: "/react-tables/user-datatable",
        isPro: true
      },
      {
        id: uniqueId(),
        icon: Package,
        name: "Orders",
        url: "/react-tables/order-datatable",
        isPro: true
      },
    ],
  },
];

export default SidebarContent;
