import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  LayoutDashboard,
  Users,
  Settings,
  Moon,
  Sun,
  Languages,
  Boxes,
  Puzzle,
  KanbanSquare,
  Contact,
  Package,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/users", labelKey: "nav.users", icon: Users, end: false },
  { to: "/crm", labelKey: "nav.crm", icon: KanbanSquare, end: false },
  { to: "/customers", labelKey: "nav.customers", icon: Contact, end: false },
  { to: "/products", labelKey: "nav.products", icon: Package, end: false },
  { to: "/showcase", labelKey: "nav.components", icon: Puzzle, end: false },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, end: false },
];

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleLang = () => {
    const next = i18n.language.startsWith("zh") ? "en" : "zh";
    i18n.changeLanguage(next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  };

  return (
    <div
      className="app-shell grid h-dvh gap-3 overflow-hidden bg-canvas p-3"
      data-collapsed={collapsed}
    >
      {/* Sidebar — floating card (island) */}
      <aside className="flex flex-col overflow-hidden rounded-2xl bg-card p-3 shadow-card">
        <div className={cn("flex h-14 items-center gap-2 px-1", collapsed && "justify-center")}>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight">{t("appName")}</span>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 py-3">
          {navItems.map((item) => {
            const active =
              item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </NavLink>
            );
          })}
        </nav>
        <button
          className="mt-auto rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? "»" : "«"}
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <header className="flex h-14 shrink-0 items-center justify-between rounded-2xl bg-card px-4 shadow-card">
          <div className="text-sm font-medium text-muted-foreground">
            {t(
              navItems.find((n) =>
                n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
              )?.labelKey ?? "appName",
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLang} aria-label="toggle language">
              <Languages className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="toggle theme"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
          </div>
        </header>
        <main className="island-canvas min-h-0 flex-1 overflow-y-auto rounded-2xl px-4 py-5 md:px-6 md:py-6">
          {/* CRM 看板脱离 Container 做全宽；其余页面保持居中容器 */}
          {location.pathname === "/crm" ? <Outlet /> : <Container size="lg"><Outlet /></Container>}
        </main>
      </div>
    </div>
  );
}
