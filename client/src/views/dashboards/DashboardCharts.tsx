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
import type { ChartKind } from "./configs";

/** V1 · 可配标题的图表卡，复用 D2 验证过的 ChartContainer 与 --chart-* token */
const monthly = [
  { month: "Jan", primary: 186, secondary: 80 },
  { month: "Feb", primary: 305, secondary: 200 },
  { month: "Mar", primary: 237, secondary: 120 },
  { month: "Apr", primary: 173, secondary: 190 },
  { month: "May", primary: 209, secondary: 130 },
  { month: "Jun", primary: 264, secondary: 140 },
];

const config: ChartConfig = {
  primary: { label: "Current", color: "var(--chart-1)" },
  secondary: { label: "Previous", color: "var(--chart-2)" },
};

const pieData = [
  { name: "Segment A", value: 45, fill: "var(--chart-1)" },
  { name: "Segment B", value: 28, fill: "var(--chart-2)" },
  { name: "Segment C", value: 17, fill: "var(--chart-3)" },
  { name: "Segment D", value: 10, fill: "var(--chart-4)" },
];

const radialData = monthly.slice(0, 4).map((d, i) => ({
  ...d,
  fill: `var(--chart-${i + 1})`,
}));

const axisProps = {
  tickLine: false as const,
  axisLine: false as const,
  tickMargin: 8,
  tick: { fontSize: 11, fill: "var(--muted-foreground)" },
};

function Plot({ kind }: { kind: ChartKind }) {
  if (kind === "pie") {
    return (
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={2}>
          {pieData.map((d) => <Cell key={d.name} fill={d.fill} />)}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    );
  }
  if (kind === "radial") {
    return (
      <RadialBarChart data={radialData} innerRadius={28} outerRadius={96} barSize={12}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <RadialBar dataKey="primary" background={{ fill: "var(--muted)" }} cornerRadius={6} />
        <ChartLegend content={<ChartLegendContent />} />
      </RadialBarChart>
    );
  }
  if (kind === "bar") {
    return (
      <BarChart data={monthly} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="primary" fill="var(--color-primary)" radius={4} />
        <Bar dataKey="secondary" fill="var(--color-secondary)" radius={4} />
      </BarChart>
    );
  }
  if (kind === "line") {
    return (
      <LineChart data={monthly} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="primary" type="monotone" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
        <Line dataKey="secondary" type="monotone" stroke="var(--color-secondary)" strokeWidth={2} dot={false} />
      </LineChart>
    );
  }
  return (
    <AreaChart data={monthly} margin={{ left: 8, right: 8, top: 8 }}>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
      <XAxis dataKey="month" {...axisProps} />
      <YAxis {...axisProps} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Area dataKey="secondary" type="monotone" fill="var(--color-secondary)" fillOpacity={0.25} stroke="var(--color-secondary)" />
      <Area dataKey="primary" type="monotone" fill="var(--color-primary)" fillOpacity={0.3} stroke="var(--color-primary)" />
    </AreaChart>
  );
}

export function DashboardChartCard({
  title,
  kind,
}: {
  title: string;
  kind: ChartKind;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[220px] w-full">
          <Plot kind={kind} />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
