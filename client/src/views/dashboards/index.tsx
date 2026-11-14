import { useLocation } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardChartCard } from "./DashboardCharts";
import { DASHBOARD_CONFIGS, type Kpi } from "./configs";

/** V1 · 7 个新 dashboards 的统一成套页面（按 pathname 分发配置） */
const SPARKLINES = [
  "0,26 12,20 24,22 36,12 48,16 60,8 72,10 84,2",
  "0,22 12,14 24,18 36,10 48,12 60,6 72,12 84,4",
  "0,6 12,10 24,8 36,16 48,14 60,22 72,18 84,26",
  "0,24 12,24 24,18 36,20 48,12 60,14 72,6 84,8",
];

function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
          <p className="mt-1.5 text-xl font-semibold tracking-tight">{kpi.value}</p>
          <p className={`mt-1 text-xs ${kpi.down ? "text-red-500" : "text-emerald-600"}`}>
            {kpi.delta}
          </p>
        </div>
        <svg
          viewBox="0 0 84 28"
          className="mt-1 h-8 w-20 shrink-0 text-primary"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <polyline
            points={SPARKLINES[index % SPARKLINES.length]}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CardContent>
    </Card>
  );
}

function DataTable({ table }: { table: (typeof DASHBOARD_CONFIGS)[number]["table"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{table.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {table.columns.map((c) => <TableHead key={c}>{c}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const DashboardPage = () => {
  const { pathname } = useLocation();
  const cfg = DASHBOARD_CONFIGS.find((c) => c.path === pathname);
  if (!cfg) return null;

  const [first, second, ...rest] = cfg.charts;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2 pb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{cfg.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{cfg.subtitle}</p>
        </div>
        <span className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
          Last 30 Days
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cfg.kpis.map((kpi, i) => <KpiCard key={kpi.label} kpi={kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {first && <DashboardChartCard title={first.title} kind={first.kind} />}
        {second && <DashboardChartCard title={second.title} kind={second.kind} />}
        {rest.map((c) => (
          <div key={c.title} className={c.wide ? "lg:col-span-2" : ""}>
            <DashboardChartCard title={c.title} kind={c.kind} />
          </div>
        ))}
      </div>

      <DataTable table={cfg.table} />
    </div>
  );
};

export default DashboardPage;
