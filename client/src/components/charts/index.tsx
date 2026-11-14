import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * D2 · 图表 wrappers
 *
 * 线上商业版站内没有独立的图表路由：侧栏 / 水平菜单的 Charts 分组
 * 7 个链接全是指向 shadcn-dashboard-com.vercel.app 的外链，站内图表
 * 只嵌在 dashboard 卡片里，且全部用 Recharts（JS chunk 里 Area/Bar/
 * Line/Pie/Scatter/Composed 六类，XAxis 42 / YAxis 47 次）。
 *
 * 这里按线上用到的类型补齐 6 个可复用 wrapper，统一走本地已有的
 * ChartContainer / ChartTooltipContent / ChartLegendContent，配色使用
 * --chart-* token，供后续 V 阶段成套页面直接复用。
 */

const monthly = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 173, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 264, mobile: 140 },
];

const config: ChartConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
};

const pieData = [
  { name: "Chrome", value: 45, fill: "var(--chart-1)" },
  { name: "Safari", value: 28, fill: "var(--chart-2)" },
  { name: "Firefox", value: 17, fill: "var(--chart-3)" },
  { name: "Edge", value: 10, fill: "var(--chart-4)" },
];

const axisProps = {
  tickLine: false as const,
  axisLine: false as const,
  tickMargin: 8,
  tick: { fontSize: 11, fill: "var(--muted-foreground)" },
};

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AreaChartCard() {
  return (
    <ChartCard title="Area Chart" description="Visitors over the last six months">
      <ChartContainer config={config} className="h-[220px] w-full">
        <AreaChart data={monthly} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area dataKey="mobile" type="monotone" fill="var(--color-mobile)" fillOpacity={0.3} stroke="var(--color-mobile)" />
          <Area dataKey="desktop" type="monotone" fill="var(--color-desktop)" fillOpacity={0.3} stroke="var(--color-desktop)" />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function BarChartCard() {
  return (
    <ChartCard title="Bar Chart" description="Desktop vs mobile sessions">
      <ChartContainer config={config} className="h-[220px] w-full">
        <BarChart data={monthly} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function LineChartCard() {
  return (
    <ChartCard title="Line Chart" description="Trend comparison by device">
      <ChartContainer config={config} className="h-[220px] w-full">
        <LineChart data={monthly} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
          <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function PieChartCard() {
  return (
    <ChartCard title="Pie Chart" description="Browser share this month">
      <ChartContainer config={config} className="h-[220px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function RadarChartCard() {
  return (
    <ChartCard title="Radar Chart" description="Traffic by weekday">
      <ChartContainer config={config} className="h-[220px] w-full">
        <RadarChart data={monthly}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.35} stroke="var(--color-desktop)" />
          <Radar dataKey="mobile" fill="var(--color-mobile)" fillOpacity={0.25} stroke="var(--color-mobile)" />
        </RadarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function RadialBarChartCard() {
  const radialData = monthly.slice(0, 4).map((item, i) => ({
    ...item,
    fill: `var(--chart-${i + 1})`,
  }));
  return (
    <ChartCard title="Radialbar Chart" description="Quarterly completion">
      <ChartContainer config={config} className="h-[220px] w-full">
        <RadialBarChart data={radialData} innerRadius={28} outerRadius={96} barSize={12}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <RadialBar dataKey="desktop" background={{ fill: "var(--muted)" }} cornerRadius={6} />
          <ChartLegend content={<ChartLegendContent />} />
        </RadialBarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export const CHART_CARDS = [
  AreaChartCard,
  BarChartCard,
  LineChartCard,
  PieChartCard,
  RadarChartCard,
  RadialBarChartCard,
] as const;
