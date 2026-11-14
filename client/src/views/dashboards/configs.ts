/**
 * V1 · 7 个新 dashboards 的成套配置
 *
 * 卡片标题、KPI 数值与页面标题均按线上 demo 逐页取证
 * （/tmp/rea_v1_structure.json + /tmp/rea-v1-*.png）。
 * 路径 B 成色为「视觉 1:1 + 结构近似」：这里用统一的
 * banner / KPI 行 / 图表区 / 表格区框架还原每页的卡片构成，
 * 明细数据用示例占位（用户允许占位），不复制线上业务实现。
 */
export type ChartKind = "area" | "bar" | "line" | "pie" | "radial";

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  down?: boolean;
}

export interface ChartCardConfig {
  title: string;
  kind: ChartKind;
  wide?: boolean;
}

export interface TableConfig {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface DashboardConfig {
  path: string;
  menuName: string;
  title: string;
  subtitle: string;
  kpis: Kpi[];
  charts: ChartCardConfig[];
  table: TableConfig;
}

export const DASHBOARD_CONFIGS: DashboardConfig[] = [
  {
    path: "/dashboards/ecommerce",
    menuName: "eCommerce",
    title: "eCommerce",
    subtitle: "Track sales, orders and customer activity.",
    kpis: [
      { label: "Total Sales", value: "$98,452.76", delta: "+32.8% vs last month" },
      { label: "Monthly Sales", value: "$36,890", delta: "+32.8% vs last month" },
      { label: "Revenue Growth", value: "+24%", delta: "+32.8% vs last month" },
      { label: "Total Orders", value: "1,920", delta: "+32.8% vs last month" },
    ],
    charts: [
      { title: "Customer Segmentation", kind: "pie" },
      { title: "Order Overview", kind: "area" },
      { title: "User Activity", kind: "bar", wide: true },
    ],
    table: {
      title: "Recent Sales Orders",
      columns: ["Order", "Customer", "Status", "Amount"],
      rows: [
        ["#10241", "Olivia Rhye", "Completed", "$1,250"],
        ["#10242", "Phoenix Baker", "Processing", "$2,400"],
        ["#10243", "Lana Steiner", "Completed", "$980"],
        ["#10244", "Demi Wilkinson", "Pending", "$1,760"],
      ],
    },
  },
  {
    path: "/dashboards/logistics",
    menuName: "Logistics",
    title: "Logistics & Supply Chain Command",
    subtitle: "Fleet, freight and warehouse performance at a glance.",
    kpis: [
      { label: "Active Fleet Vehicles", value: "248", delta: "+8.2% vs last month" },
      { label: "On-Time Delivery Rate", value: "96.4%", delta: "+2.1% vs last month" },
      { label: "Freight Volume", value: "18.2K t", delta: "+11.5% vs last month" },
      { label: "Fleet Fuel Efficiency", value: "7.8 km/L", delta: "-1.4% vs last month", down: true },
    ],
    charts: [
      { title: "Freight Volume & SLA Performance", kind: "line" },
      { title: "Carrier Freight & Storage Expenses", kind: "bar" },
      { title: "Shipment Status Distribution", kind: "radial", wide: true },
    ],
    table: {
      title: "Active Freight Shipments",
      columns: ["Shipment", "Route", "Carrier", "ETA"],
      rows: [
        ["SHP-2041", "NY → BOS", "SwiftLine", "2h 15m"],
        ["SHP-2042", "LA → SF", "FastFreight", "1h 40m"],
        ["SHP-2043", "CHI → DET", "NorthCargo", "3h 05m"],
        ["SHP-2044", "SEA → POR", "SwiftLine", "2h 50m"],
      ],
    },
  },
  {
    path: "/dashboards/restaurant",
    menuName: "Restaurant",
    title: "DineCore Bistro POS",
    subtitle: "Live dining revenue, orders and kitchen queue.",
    kpis: [
      { label: "Daily Covers", value: "1.2K", delta: "+12.3% vs yesterday" },
      { label: "Daily Revenue", value: "$5,840.50", delta: "+9.4% vs yesterday" },
      { label: "Orders Served", value: "176", delta: "+6.8% vs yesterday" },
      { label: "Tables Occupied", value: "18 / 24", delta: "+3.1% vs yesterday" },
    ],
    charts: [
      { title: "Daily Dining Revenue", kind: "area" },
      { title: "POS Order Channels", kind: "pie" },
      { title: "Guest Satisfaction", kind: "line", wide: true },
    ],
    table: {
      title: "Top Selling Dishes",
      columns: ["Dish", "Category", "Orders", "Revenue"],
      rows: [
        ["Truffle Pasta", "Main", "84", "$1,680"],
        ["Wood-fired Pizza", "Main", "72", "$1,224"],
        ["Burrata Salad", "Starter", "61", "$793"],
        ["Tiramisu", "Dessert", "48", "$528"],
      ],
    },
  },
  {
    path: "/dashboards/health",
    menuName: "Health Management",
    title: "Health Management",
    subtitle: "Revenue, appointments and patient care overview.",
    kpis: [
      { label: "Monthly Revenue", value: "$275K", delta: "+94% vs last month" },
      { label: "Weekly Appointments", value: "1,284", delta: "+12.5% vs last week" },
      { label: "Recovery Rate", value: "92.6%", delta: "+4.2% vs last month" },
      { label: "Active Patients", value: "3,420", delta: "+7.9% vs last month" },
    ],
    charts: [
      { title: "Patient Flow Overview", kind: "area" },
      { title: "Department Stats", kind: "bar" },
      { title: "Doctor Performance", kind: "radial", wide: true },
    ],
    table: {
      title: "Recent Patients",
      columns: ["Patient", "Department", "Status", "Visit"],
      rows: [
        ["Olivia Rhye", "Cardiology", "In Care", "Nov 12"],
        ["Phoenix Baker", "Neurology", "Recovered", "Nov 11"],
        ["Lana Steiner", "Pediatrics", "In Care", "Nov 11"],
        ["Demi Wilkinson", "Orthopedics", "Scheduled", "Nov 10"],
      ],
    },
  },
  {
    path: "/dashboards/school",
    menuName: "School Management",
    title: "School Management",
    subtitle: "Track student performance, attendance, and school activities.",
    kpis: [
      { label: "Total Students", value: "2,450", delta: "+12.3% vs last term" },
      { label: "Total Teachers", value: "148", delta: "+5.2% vs last term" },
      { label: "Attendance Rate", value: "92.4%", delta: "-1.2% vs last term", down: true },
      { label: "Active Classes", value: "64", delta: "+3.1% vs last term" },
    ],
    charts: [
      { title: "Attendance Overview", kind: "line" },
      { title: "Grade Distribution", kind: "radial" },
      { title: "Fees Paid vs Pending", kind: "bar", wide: true },
    ],
    table: {
      title: "Recent Enrollments",
      columns: ["Student", "Grade", "Class", "Enrolled"],
      rows: [
        ["Olivia Rhye", "A", "10-B", "Nov 12"],
        ["Phoenix Baker", "B", "9-A", "Nov 11"],
        ["Lana Steiner", "A", "11-C", "Nov 10"],
        ["Demi Wilkinson", "C", "8-B", "Nov 09"],
      ],
    },
  },
  {
    path: "/dashboards/saas-ai",
    menuName: "SaaS + AI Dashboard",
    title: "Welcome back, David",
    subtitle: "AI revenue, active users and automation growth.",
    kpis: [
      { label: "AI Revenue", value: "$128.4K", delta: "+18.6% vs last month" },
      { label: "Active AI Users", value: "24.8K", delta: "+9.2% vs last month" },
      { label: "AI Automations", value: "1,842", delta: "+22.4% vs last month" },
      { label: "MRR Growth", value: "+14.7%", delta: "+3.8% vs last month" },
    ],
    charts: [
      { title: "Sales Overview", kind: "area" },
      { title: "Revenue Distribution", kind: "pie" },
      { title: "Best Performing AI Products", kind: "bar", wide: true },
    ],
    table: {
      title: "Best Performing AI Products",
      columns: ["Product", "Plan", "Users", "MRR"],
      rows: [
        ["AI Writer", "Pro", "8,420", "$42.1K"],
        ["AI Analyst", "Team", "5,190", "$31.8K"],
        ["AI Assistant", "Pro", "4,760", "$24.6K"],
        ["AI Studio", "Enterprise", "2,310", "$18.2K"],
      ],
    },
  },
  {
    path: "/dashboards/analytics",
    menuName: "Analytics",
    title: "Key Insights",
    subtitle: "Weekly sales, new users and campaign performance.",
    kpis: [
      { label: "Weekly sales", value: "714k", delta: "+12.8% vs last week" },
      { label: "New users", value: "1.35m", delta: "+8.4% vs last week" },
      { label: "Purchase Orders", value: "1.72m", delta: "+16.2% vs last week" },
      { label: "Campaign Performance", value: "+24%", delta: "+5.1% vs last week" },
    ],
    charts: [
      { title: "Sales Overview", kind: "line" },
      { title: "Sales Distribution", kind: "pie" },
      { title: "Top Selling Products", kind: "bar", wide: true },
    ],
    table: {
      title: "Top Selling Products",
      columns: ["Product", "Category", "Units", "Revenue"],
      rows: [
        ["Smartwatch Pro", "Gadget", "2,874", "$84.2K"],
        ["Wireless Buds", "Audio", "1,984", "$52.7K"],
        ["Studio Headset", "Audio", "1,120", "$41.3K"],
        ["Travel Backpack", "Accessory", "984", "$28.9K"],
      ],
    },
  },
];

export const DASHBOARD_PATHS = DASHBOARD_CONFIGS.map((c) => c.path);
