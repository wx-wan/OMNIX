import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Stack } from "@/components/layout/Stack";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get<User[]>("/users")
      .then((r) => setUsers(r.data))
      .catch(() => setUsers([]));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Stack gap={6}>
      <PageHeader title={t("nav.users")} actions={<Button>{t("common.confirm")}</Button>} />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("common.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Section noPadding>
        <div className="divide-y divide-border">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted-foreground">{t("common.search")}…</p>
          )}
        </div>
      </Section>
    </Stack>
  );
}
