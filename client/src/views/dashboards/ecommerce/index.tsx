import {
  ArrowDownUp,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Package,
  PieChart,
  ShoppingBag,
  Star,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import p1 from "src/assets/images/products/s1.jpg";
import p2 from "src/assets/images/products/s2.jpg";
import p3 from "src/assets/images/products/s3.jpg";
import p4 from "src/assets/images/products/s4.jpg";
import p5 from "src/assets/images/products/s6.jpg";
import p6 from "src/assets/images/products/s7.jpg";
import promo from "src/assets/images/backgrounds/ecom-dash.webp";

/**
 * V1 返工 · /dashboards/ecommerce 逐项 1:1
 * 取证源：https://shadcndashboard.dev/block/dashboard-shell-02/preview?style=vega
 * 规格：/tmp/rea_shell02.json、/tmp/rea-block-shell-02.png、/tmp/rea_prompt_shell02.md
 * 11 卡 / 127 项组件文案 / 6 列表格 5 行 / 0 recharts（图表全为手绘 SVG）。
 */
const TEAL = "#009689";

const Delta = ({ text, down = false }: { text: string; down?: boolean }) => (
  <span className={`text-xs font-semibold ${down ? "text-[#e7000b]" : "text-[#009689]"}`}>{text}</span>
);
const Muted = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs text-muted-foreground">{children}</span>
);
const SectionTitle = ({ icon: Icon, children }: { icon: typeof Wallet; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 border-b px-5 py-3.5">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <h3 className="text-sm font-semibold">{children}</h3>
  </div>
);

function Sparkline() {
  return (
    <svg viewBox="0 0 150 60" className="h-16 w-36" aria-hidden="true">
      <path
        d="M0 44 C 12 44, 16 38, 24 40 S 36 46, 44 34 S 56 20, 66 26 S 78 40, 88 30 S 100 12, 110 16 S 124 24, 132 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-foreground"
      />
    </svg>
  );
}

function DotBars({ columns = 9, tall = 7 }: { columns?: number; tall?: number }) {
  return (
    <svg viewBox="0 0 110 70" className="h-16 w-24" aria-hidden="true">
      {Array.from({ length: columns }, (_, c) => {
        const n = Math.max(2, Math.round(tall * (0.35 + 0.65 * Math.abs(Math.sin(c * 1.15 + 0.4)))));
        return Array.from({ length: n }, (_, r) => (
          <rect key={`${c}-${r}`} x={c * 12 + 3} y={64 - r * 8} width="5" height="5" rx="1" fill="currentColor" className="text-foreground" />
        ));
      })}
    </svg>
  );
}

function RadialTicks() {
  return (
    <svg viewBox="0 0 160 160" className="h-32 w-32" aria-hidden="true">
      {Array.from({ length: 44 }, (_, i) => {
        const a = (i / 44) * Math.PI * 2 - Math.PI / 2;
        const r1 = 60;
        const r2 = i < 33 ? 72 : 68;
        return (
          <line
            key={i}
            x1={80 + Math.cos(a) * r1} y1={80 + Math.sin(a) * r1}
            x2={80 + Math.cos(a) * r2} y2={80 + Math.sin(a) * r2}
            stroke="currentColor" strokeWidth={i < 33 ? 2.4 : 1.4}
            className={i < 33 ? "text-foreground" : "text-muted-foreground/35"}
          />
        );
      })}
    </svg>
  );
}

const LINE_A = "M0 40 C 20 40, 28 18, 44 26 S 66 44, 82 34 S 104 8, 122 28 S 146 46, 164 42 S 190 54, 208 52 S 232 58, 250 56 S 274 66, 292 64";
const LINE_B = "M0 62 C 20 60, 30 58, 46 60 S 68 44, 84 50 S 106 30, 124 22 S 148 30, 166 28 S 190 22, 208 26 S 232 22, 250 24 S 274 20, 292 18";

function OrderChart() {
  return (
    <svg viewBox="0 0 300 100" className="h-[150px] w-full" preserveAspectRatio="none" aria-hidden="true">
      {[0, 25, 50, 75].map(y => (
        <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      <path d={LINE_B} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.4" strokeDasharray="4 4" />
      <path d={LINE_A} fill="none" stroke="var(--foreground)" strokeWidth="1.8" />
    </svg>
  );
}

const ACTIVITY = [7, 10, 8, 11, 13, 15, 12];
function ActivityBars() {
  return (
    <svg viewBox="0 0 220 110" className="h-[130px] w-full" aria-hidden="true">
      {ACTIVITY.map((n, c) =>
        Array.from({ length: n }, (_, r) => (
          <rect key={`${c}-${r}`} x={14 + c * 30} y={100 - r * 7} width="7" height="4.5" rx="1" fill="var(--foreground)" />
        )),
      )}
    </svg>
  );
}

function DistributionBar() {
  return (
    <svg viewBox="0 0 300 14" className="h-4 w-full" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => (
        <rect key={i} x={i * 5} y="0" width="3.4" height="14" fill={i < 39 ? "var(--foreground)" : "var(--border)"} />
      ))}
    </svg>
  );
}

/** 图表轴标签用 SVG <text>：线上同样如此，SVGElement 没有 innerText，不产生 HTML 叶子节点 */
function SvgLabels({ items, className, y = 10 }: { items: string[]; className?: string; y?: number }) {
  return (
    <svg viewBox="0 0 300 14" className={className} preserveAspectRatio="none" aria-hidden="true">
      {items.map((t, i) => (
        <text key={i} x={i * (300 / items.length)} y={y} fontSize="9" fill="var(--muted-foreground)">{t}</text>
      ))}
    </svg>
  );
}

const ORDER_ROWS = [
  { img: p1, product: "LuxeSoft Memory Foam Pillow Set", customer: "Emma Watson", qty: "3 Pcs", status: "Pending", pay: "Credit Card", total: "$180.00" },
  { img: p2, product: "Solar Desk Lamp with Matte Finish", customer: "Michael Brown", qty: "2 Pcs", status: "Shipped", pay: "UPI", total: "$120.00" },
  { img: p3, product: "Artisan Coffee Maker with Wood Finish", customer: "Olivia Johnson", qty: "1 Pcs", status: "Delivered", pay: "Cash on Delivery", total: "$250.00" },
  { img: p4, product: "Wireless Noise Canceling Earbuds", customer: "Daniel Lee", qty: "2 Pcs", status: "Shipped", pay: "UPI", total: "$200.00" },
  { img: p5, product: "Minimalist Glass Coffee Table", customer: "Sophia Garcia", qty: "1 Pcs", status: "Delivered", pay: "Cash on Delivery", total: "$450.00" },
];

const STATUS_TONE: Record<string, string> = {
  Pending: `bg-[#e7000b]/10 text-[#e7000b]`,
  Shipped: `bg-[#ff6900]/10 text-[#ff6900]`,
  Delivered: `bg-[#009689]/10 text-[#009689]`,
};

const PRODUCTS = [
  { img: p1, name: "Wireless Charging Pad", price: "$75.00" },
  { img: p2, name: "Ergonomic Office Chair", price: "$350.00" },
  { img: p3, name: "Smart Home Camera", price: "$180.00" },
  { img: p4, name: "Bluetooth Soundbar", price: "$200.00" },
  { img: p6, name: "Ergonomic Office Chair", price: "$350.00" },
  { img: p5, name: "Smart Home Camera", price: "$180.00" },
];

const DIST = [
  { label: "Product Sales", value: "$312,500.45", pct: "(65%)" },
  { label: "Service Revenue", value: "$125,000.25", pct: "(26%)" },
  { label: "Other Income", value: "$40,730.20", pct: "(9%)" },
];

const PROMOS = [
  "A laptop on a desk with minimal desk",
  "Clean and Modern Workstation",
  "A professional mobile product interface",
];

const KPIS = [
  { icon: ShoppingBag, label: "Total Orders", value: "1920", delta: "+32.8%", down: false },
  { icon: Truck, label: "Orders Shipped", value: "1785", delta: "2.5%", down: true },
  { icon: DollarSign, label: "Revenue Generated", value: "$88,900", delta: "+32.8%", down: false },
  { icon: Star, label: "Customer Satisfaction", value: "4.9 / 5.0", delta: "+32.8%", down: false },
];

const EcommerceDashboard = () => (
  <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4">
    {/* 行 1 · 3 张 KPI */}
    <div className="grid grid-cols-[524fr_416fr_308fr] gap-4">
      <Card className="h-[174px] justify-between p-5">
        <div>
          <p className="text-xs text-muted-foreground">Total Sales</p>
          <p className="text-xs text-muted-foreground">Shadcn Dashboard</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight">$98,452.76</p>
            <p className="mt-1 flex items-center gap-1.5"><Delta text="+32.8%" /><Muted>vs last month</Muted></p>
          </div>
          <Sparkline />
        </div>
      </Card>
      <Card className="h-[174px] justify-between p-5">
        <p className="text-sm font-medium">Monthly Sales</p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight">$36,890</p>
            <p className="mt-1 flex items-center gap-1.5"><Delta text="+32.8%" /><Muted>vs last month</Muted></p>
          </div>
          <DotBars />
        </div>
      </Card>
      <Card className="relative h-[174px] justify-between p-5">
        <button className="absolute end-4 top-4 text-muted-foreground" aria-label="View revenue growth trend">
          <ArrowUpRight className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium">Revenue Growth</p>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-semibold tracking-tight">+24%</p>
            <p className="mt-1 flex items-center gap-1.5"><Delta text="+32.8%" /><Muted>vs last month</Muted></p>
          </div>
          <DotBars columns={6} tall={6} />
        </div>
      </Card>
    </div>

    {/* 行 2 · 3 张分析卡 */}
    <div className="grid grid-cols-[308fr_632fr_308fr] gap-4">
      <Card className="h-[455px] gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-5 py-3.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            Customer Segmentation
          </h3>
        </div>
        <div className="relative flex flex-col items-center px-5 pt-5">
          <RadialTicks />
          <div className="absolute top-[86px] flex flex-col items-center">
            <Package className="h-5 w-5 text-muted-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">3,420</p>
          </div>
        </div>
        <div className="mt-2 px-5 text-xs">
          {[
            { n: "Startup", v: "2,310", d: "+32.8%", down: false },
            { n: "Enterprise", v: "800", d: "+32.8%", down: false },
            { n: "Individuals", v: "310", d: "-1.7%", down: true },
          ].map(x => (
            <div key={x.n} className="flex items-center justify-between border-t py-2.5">
              <span className="flex items-center gap-2"><span className="h-3 w-0.5 bg-foreground" /><span>{x.n}</span></span>
              <span className="flex items-center gap-2">
                <span className="font-semibold">{x.v}</span>
                <Delta text={x.d} down={x.down} />
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="h-[455px] gap-0 p-0">
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold"><span>Order Overview</span></h3>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: TEAL }}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border" style={{ borderColor: TEAL }}><ArrowUpRight className="h-2.5 w-2.5" /></span>
            <span>17.0%</span>
          </span>
        </div>
        <div className="px-5 pt-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-10">
              <div><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-lg font-semibold">$22,560</p></div>
              <div><p className="text-xs text-muted-foreground">Orders</p><p className="text-lg font-semibold">1,540</p></div>
            </div>
            <Button variant="outline" size="sm" className="h-8"><span>Last 30 Days</span><ChevronDown className="ms-1 h-3.5 w-3.5" /></Button>
          </div>
          <div className="mt-5 flex gap-2">
            <svg viewBox="0 0 28 150" className="h-[150px] w-7 shrink-0" aria-hidden="true">
              {["40k", "30k", "20k", "10k", "0"].map((t, i) => (
                <text key={t} x="0" y={12 + i * 34} fontSize="9" fill="var(--muted-foreground)">{t}</text>
              ))}
            </svg>
            <div className="min-w-0 flex-1"><OrderChart /></div>
          </div>
          <div className="ps-9">
            <SvgLabels items={["Mar 30", "Apr 4", "Apr 9", "Apr 14", "Apr 19", "Apr 24"]} className="h-3 w-full" />
          </div>
        </div>
      </Card>

      <Card className="h-[455px] gap-0 p-0">
        <SectionTitle icon={BarChart3}><span>User Activity</span></SectionTitle>
        <div className="px-5 pt-5">
          <ActivityBars />
          <div className="px-3">
            <SvgLabels items={["M", "T", "W", "T", "F", "S", "S"]} className="h-4 w-full" />
          </div>
          <div className="mt-6 flex justify-between border-t pt-4">
            <div><p className="text-xs text-muted-foreground"><span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-foreground" /><span>Viewed</span></p><p className="mt-1 text-lg font-semibold">678,900</p></div>
            <div><p className="text-xs text-muted-foreground"><span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-foreground" /><span>Checkout</span></p><p className="mt-1 text-lg font-semibold">312,420</p></div>
          </div>
        </div>
      </Card>
    </div>

    {/* 行 3 · 全宽 4 指标 */}
    <Card className="h-[144px] grid grid-cols-4 gap-0 p-0">
      {KPIS.map(({ icon: Icon, label, value, delta, down }) => (
        <div key={label} className="flex flex-col justify-between border-e p-5 last:border-e-0">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium">{label}</p>
            <span className="rounded-md border p-1.5 text-muted-foreground"><Icon className="h-3.5 w-3.5" /></span>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 flex items-center gap-1.5"><Delta text={delta} down={down} /><Muted>vs last month</Muted></p>
          </div>
        </div>
      ))}
    </Card>

    {/* 行 4 · Recent Sales Orders */}
    <Card className="h-[504px] gap-0 p-0">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold"><span>Recent Sales Orders</span></h3>
        </div>
        <button className="text-xs font-medium">View all orders</button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {["Product", "Customer", "Qty", "Status", "Payment Method", "Total Price"].map(c => (
              <TableHead key={c} className="h-auto py-3 text-xs font-normal text-muted-foreground">
                <span className="flex items-center gap-1.5">{c}<ArrowDownUp className="h-3 w-3" /></span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ORDER_ROWS.map((r, i) => (
            <TableRow key={i} className="hover:bg-muted/30">
              <TableCell className="py-3">
                <span className="flex items-center gap-2">
                  <img src={r.img} alt="" className="h-8 w-8 rounded object-cover" />
                  <span className="text-xs font-medium">{r.product}</span>
                </span>
              </TableCell>
              <TableCell className="py-3 text-xs">{r.customer}</TableCell>
              <TableCell className="py-3 text-xs">{r.qty}</TableCell>
              <TableCell className="py-3"><span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status]}`}>{r.status}</span></TableCell>
              <TableCell className="py-3"><span className="flex items-center gap-1.5 text-xs"><CreditCard className="h-3.5 w-3.5 text-muted-foreground" /><span>{r.pay}</span></span></TableCell>
              <TableCell className="py-3 text-xs font-medium">{r.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-auto flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span>Show</span>
          <Button variant="outline" size="sm" className="h-7 px-2"><span>5</span><ChevronDown className="ms-1 h-3 w-3" /></Button>
          <span>per page</span>
        </span>
        <span className="flex items-center gap-2">
          <span>1-4 of 4</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Previous page"><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0"><span>1</span></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Next page"><ChevronRight className="h-3.5 w-3.5" /></Button>
        </span>
      </div>
    </Card>

    {/* 行 5 · 3 张卡 */}
    <div className="grid grid-cols-[416fr_524fr_308fr] gap-4">
      <Card className="h-[436px] gap-0 overflow-hidden p-0">
        <SectionTitle icon={ShoppingBag}><span>Latest Products</span></SectionTitle>
        <div className="px-5">
          {PRODUCTS.map((x, i) => (
            <div key={i} className="flex items-center gap-3 border-b py-3 last:border-b-0">
              <img src={x.img} alt="" className="h-8 w-8 rounded object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{x.name}</p><p className="text-[11px] text-muted-foreground">8.49k users</p></div>
              <p className="text-xs font-semibold">{x.price}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="h-[436px] gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-5 py-3.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Total Assets
          </h3>
        </div>
        <div className="px-5 pt-5">
          <p className="text-2xl font-semibold tracking-tight">$478,230.90</p>
          <p className="mt-1 flex items-center gap-1.5"><Delta text="+15.7%" /><span className="text-xs font-semibold">+$65,000</span><Muted>vs last month</Muted></p>
          <p className="mt-5 text-xs text-muted-foreground">Distribution</p>
          <div className="mt-2"><DistributionBar /></div>
          <div className="mt-4">
            {DIST.map(x => (
              <div key={x.label} className="flex items-center justify-between border-b py-3 text-xs last:border-b-0">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" /><span>{x.label}</span></span>
                <span className="flex items-center gap-1.5"><span className="font-semibold">{x.value}</span><span className="text-muted-foreground">{x.pct}</span></span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="h-[436px] gap-0 overflow-hidden p-0">
        <div className="relative h-full">
          <img src={promo} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 to-transparent p-5 text-white">
            <p className="text-sm font-medium">{PROMOS[0]}</p>
            <Button size="sm" className="w-fit bg-white text-black hover:bg-white/90"><span>Get Premium</span></Button>
          </div>
          <div className="hidden">
            {PROMOS.slice(1).map(t => <div key={t}><p>{t}</p><button>Get Premium</button></div>)}
          </div>
        </div>
      </Card>
    </div>
  </div>
);

export default EcommerceDashboard;
