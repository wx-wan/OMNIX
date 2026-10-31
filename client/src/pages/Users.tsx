import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("nav.users")}</h1>
        <Button>{t("common.confirm")}</Button>
      </div>

      <div className="relative">
        <Search className="search-field-icon absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder={t("common.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-6 py-4 text-sm text-muted-foreground">{t("common.search")}…</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
