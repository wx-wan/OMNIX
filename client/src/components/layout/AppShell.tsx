import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Settings,
  Moon,
  Sun,
  Languages,
  Boxes,
  Puzzle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/users", labelKey: "nav.users", icon: Users, end: false },
  { to: "/showcase", labelKey: "nav.components", icon: Puzzle, end: false },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, end: false },
];

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language.startsWith("zh") ? "en" : "zh");
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight">{t("appName")}</span>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
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
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
          className="mx-2 mb-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? "»" : "«"}
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="text-sm text-muted-foreground">
            {t(navItems.find((n) =>
              n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
            )?.labelKey ?? "appName")}
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
        <main className="flex-1 overflow-y-auto page-pad">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
