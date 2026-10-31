import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth, userInitials } from "@/lib/auth";
import {
  LayoutDashboard,
  Settings,
  Moon,
  Sun,
  Languages,
  Boxes,
  Puzzle,
  KanbanSquare,
  Contact,
  Package,
  LogOut,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/contacts", labelKey: "nav.contacts", icon: Contact, end: false },
  { to: "/crm", labelKey: "nav.crm", icon: KanbanSquare, end: false },
  { to: "/products", labelKey: "nav.products", icon: Package, end: false },
  { to: "/showcase", labelKey: "nav.components", icon: Puzzle, end: false },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, end: false },
];

/** 页面级操作栏：portal 到顶栏右侧 #header-actions（空时自动隐藏，不留空隙）。 */
export function HeaderAction({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setContainer(document.getElementById("header-actions"));
  }, []);
  if (!container) return null;
  return createPortal(children, container);
}

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

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
        <header className="flex h-12 shrink-0 items-center justify-between px-4 md:px-6">
          <div
            id="header-actions"
            className="flex items-center gap-2 [&:not(:has(*))]:hidden"
          />
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted">
                  <Avatar size="sm">
                    <AvatarFallback>{userInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-24 truncate">{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
                    <LogOut className="size-4" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
        <main className="min-h-0 flex-1 overflow-y-auto">
          {/* CRM 看板及其商机页（/crm/deals/*）均脱离 Container 做全宽；其余页面保持居中容器 */}
          {location.pathname.startsWith("/crm") ? <Outlet /> : <Container size="lg"><Outlet /></Container>}
        </main>
      </div>
    </div>
  );
}
