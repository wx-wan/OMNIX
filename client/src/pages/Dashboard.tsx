import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users as UsersIcon,
  Activity,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

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
      api.get<RecentUser[]>("/users?limit=5").catch(() => ({ data: [] as RecentUser[] })),
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(stats.length ? stats : seedStats(t)).map((s, i) => {
          const Icon = icons[i % icons.length];
          return (
            <Card key={s.key}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{s.key}</p>
                  <p className="mt-1 text-2xl font-semibold">{s.value}</p>
                  <p
                    className={
                      "mt-1 text-xs " + (s.up ? "text-emerald-600" : "text-destructive")
                    }
                  >
                    {s.delta}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentUsers")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {(recent.length ? recent : seedUsers()).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {loading && <p className="px-6 py-4 text-sm text-muted-foreground">{t("dashboard.loading")}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
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
