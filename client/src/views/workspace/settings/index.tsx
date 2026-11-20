import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * 设置页公共外壳，逐项取自 pms-audit/dom/23-settings-*.html：
 * main > flex flex-1 flex-col gap-4 > 标题块 + flex flex-1 gap-6 > nav.w-48 + div.flex-1
 * 只复刻内容区；外壳导航沿用 OMNIX 的 FullLayout（单级侧栏）。
 */
const TABS = [
  { label: "General", to: "/settings/general" },
  { label: "Members", to: "/settings/members" },
  { label: "Billing", to: "/settings/billing" },
  { label: "Integrations", to: "/settings/integrations" },
  { label: "API Keys", to: "/settings/api-keys" },
  { label: "Preferences", to: "/settings/defaults" },
  { label: "Layout", to: "/settings/layout" },
];

export function SettingsLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl bg-background p-6">
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("Settings")}</h1>
          <p className="text-sm text-muted-foreground">{t("Manage your workspace")}</p>
        </div>
        <div className="flex min-w-0 flex-1 gap-6">
          <nav className="flex w-48 shrink-0 flex-col gap-1">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                  )
                }
              >
                {t(tab.label)}
              </NavLink>
            ))}
          </nav>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** 官方 Select 的薄封装；取证里所有下拉都是 Base UI combobox，选项只登记线上可见值。 */
export function SettingsSelect({
  value,
  onValueChange,
  options,
  formatOption,
  className,
  id,
  ariaLabel,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  options: readonly string[];
  formatOption?: (value: string) => string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onValueChange?.(next)}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={className}>
        <SelectValue>{formatOption ? formatOption(value) : undefined}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
