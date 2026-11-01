import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users as UsersIcon,
  Activity,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Section } from "@/components/layout/Section";
import { Grid } from "@/components/layout/Grid";
import { StatCard } from "@/components/layout/StatCard";

interface Stat {
  key: string;
  value: string;
  delta: string;
  up: boolean;
}

interface RecentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stat[]>([]);
  const [recent, setRecent] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get<Stat[]>("/dashboard/stats").catch(() => ({ data: [] as Stat[] })),
      api.get<RecentUser[]>("/contacts?type=user&limit=5").catch(() => ({ data: [] as RecentUser[] })),
    ]).then(([s, u]) => {
      if (!alive) return;
      setStats(s.data);
      setRecent(u.data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const icons = [UsersIcon, Activity, DollarSign, ShoppingCart];
  const data = stats.length ? stats : seedStats(t);

  return (
    <Stack gap={6}>
      <PageMeta
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
      />

      <Grid min="14rem">
        {data.map((s, i) => (
          <StatCard
            key={s.key}
            label={s.key}
            value={s.value}
            delta={s.delta}
            trend={s.up ? "up" : "down"}
            icon={icons[i % icons.length]}
          />
        ))}
      </Grid>

      <Section title={t("dashboard.recentUsers")} icon={UsersIcon} noPadding>
        <div className="flex flex-col gap-1">
          {(recent.length ? recent : seedUsers()).map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                  {u.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <p className="px-5 py-4 text-sm text-muted-foreground">{t("dashboard.loading")}</p>
          )}
        </div>
      </Section>
    </Stack>
  );
}

function seedStats(t: (k: string) => string): Stat[] {
  return [
    { key: t("dashboard.totalUsers"), value: "1,284", delta: "+12.5%", up: true },
    { key: t("dashboard.activeSessions"), value: "342", delta: "+4.1%", up: true },
    { key: t("dashboard.revenue"), value: "¥ 89,200", delta: "-2.3%", up: false },
    { key: t("dashboard.orders"), value: "1,932", delta: "+8.7%", up: true },
  ];
}

function seedUsers(): RecentUser[] {
  return [
    { id: "1", email: "ada@omnix.dev", name: "Ada Lovelace", role: "admin", createdAt: new Date().toISOString() },
    { id: "2", email: "lin@omnix.dev", name: "Lin Chen", role: "user", createdAt: new Date().toISOString() },
    { id: "3", email: "sam@omnix.dev", name: "Sam Wu", role: "user", createdAt: new Date().toISOString() },
  ];
}
