import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  CirclePlus,
  Clock,
  Flag,
  MoreHorizontal,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "src/api/workspace/use-workspace";

/**
 * PMS Workspace 1:1 结构件。
 * class 与层级逐项取自 https://pms-workspace-app.vercel.app/projects 的实时 DOM
 * （留存 pms-audit/dom/0{2..7}-*.html，实时与留存叶子序列一致）。
 * 只复刻内容区；外壳导航沿用 OMNIX 的 FullLayout。
 */

export function PmsPage({
  title,
  count,
  segmented,
  children,
}: {
  title: string;
  count: string;
  segmented?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl bg-background p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{count}</p>
        </div>
        {segmented ? <div className="flex items-center gap-2">{segmented}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function PmsSegmented({
  options,
  value,
  onChange,
  icons,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  icons?: Record<string, LucideIcon>;
}) {
  const { t } = useTranslation();
  return (
    <div aria-label="View" role="group" className="inline-flex rounded-md border p-0.5">
      {options.map((option) => {
        const Icon = icons?.[option];
        return (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-colors",
              value === option
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="size-3.5" /> : null}
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}

export function PmsCard({
  toolbar,
  children,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="group/card flex min-h-96 flex-1 flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card py-0 ring-0">
      {toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-border p-3.5">
          {toolbar}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="w-max min-w-full pb-6">{children}</div>
      </div>
    </div>
  );
}

export function PmsIconButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={Boolean(active)}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-secondary text-secondary-foreground"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

export function PmsPopover({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] hover:bg-muted hover:text-foreground"
      >
        <Icon className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function PmsNewButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted"
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}

export type PmsColumn = { label: string; w: string };

export function PmsHeader({
  columns,
  showColumnsButton = true,
  onColumnsClick,
  columnsMenu,
}: {
  columns: PmsColumn[];
  showColumnsButton?: boolean;
  onColumnsClick?: () => void;
  columnsMenu?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex h-10 items-center gap-2 border-b px-3 pl-13">
      <span className="w-56 min-w-56 flex-1 text-sm font-medium text-foreground">
        {t(columns[0].label)}
      </span>
      <div className="flex shrink-0 items-center">
        {columns.slice(1).map((column) => (
          <span
            key={column.label}
            className={cn("px-2 text-sm font-medium text-foreground", column.w)}
          >
            {t(column.label)}
          </span>
        ))}
      </div>
      {showColumnsButton ? (
        <div className="flex w-9 shrink-0 justify-end">
          {columnsMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Show or hide columns"
                title={t("Show or hide columns")}
                className="inline-flex size-6 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),10px)] text-muted-foreground outline-none hover:bg-muted hover:text-foreground data-popup-open:bg-muted"
              >
                <CirclePlus className="size-3" />
              </DropdownMenuTrigger>
              {columnsMenu}
            </DropdownMenu>
          ) : (
            <button
              type="button"
              aria-label="Show or hide columns"
              title={t("Show or hide columns")}
              onClick={onColumnsClick}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),10px)] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CirclePlus className="size-3" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function PmsGroup({
  label,
  count,
  icon: Icon,
  collapsed,
  onToggle,
  onAdd,
  addLabel,
  children,
}: {
  label: string;
  count: number;
  icon?: LucideIcon;
  collapsed?: boolean;
  onToggle?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section>
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <button
          type="button"
          aria-label="Collapse group"
          aria-expanded={!collapsed}
          onClick={onToggle}
          className="cursor-pointer text-muted-foreground"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              collapsed && "-rotate-90"
            )}
          />
        </button>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground [&_svg]:size-4">
          {Icon ? <Icon className="size-4" /> : null}
          {t(label)}
        </span>
        <span className="rounded-full bg-foreground/10 px-1.5 text-[10px] font-normal">
          {count}
        </span>
      </div>
      {!collapsed ? (
        <>
          {children}
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-8 w-full cursor-pointer items-center justify-start gap-2 px-3 text-sm font-normal text-muted-foreground hover:bg-muted/40"
            >
              <Plus className="size-3.5" />
              {addLabel}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function PmsRow({
  icon,
  title,
  description,
  suffix,
  cells,
  actions,
  onClick,
  href,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  suffix?: ReactNode;
  cells: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <span className="truncate text-sm font-medium">{title}</span>
      {description ? (
        <span className="hidden truncate text-xs text-muted-foreground lg:inline">
          {description}
        </span>
      ) : null}
      {suffix}
    </>
  );
  return (
    <div className="group flex min-h-12 items-center gap-2 border-b px-3 py-2 transition-colors hover:bg-muted/50">
      <div className="flex w-8 shrink-0 items-center justify-center">{icon}</div>
      <div className="w-56 min-w-56 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {href ? (
            <Link to={href} className="flex min-w-0 items-baseline gap-2">
              {content}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              className="flex min-w-0 items-baseline gap-2 text-left"
            >
              {content}
            </button>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center">{cells}</div>
      <div className="sticky right-0 z-10 flex w-9 shrink-0 justify-end bg-background group-hover:bg-muted">
        {actions ?? (
          <button
            type="button"
            aria-label={`Actions for ${title}`}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PmsCell({ w, children }: { w: string; children: ReactNode }) {
  return <div className={cn("min-w-0 px-2", w)}>{children}</div>;
}

export function PmsAvatar({
  name,
  avatar,
  size = 6,
}: {
  name?: string;
  avatar?: string;
  size?: number;
}) {
  const dimension = size === 6 ? "size-6" : size === 9 ? "size-9" : "size-8";
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] text-muted-foreground",
        dimension
      )}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name ?? ""}
          className="aspect-square size-full rounded-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function PmsAvatarGroup({
  people,
  max = 3,
}: {
  people: { name: string; avatar?: string }[];
  max?: number;
}) {
  return (
    <div className="flex -space-x-2 [&>*]:ring-2 [&>*]:ring-background">
      {people.slice(0, max).map((person, index) => (
        <PmsAvatar key={`${person.name}-${index}`} {...person} />
      ))}
      {people.length > max ? (
        <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground ring-2 ring-background">
          +{people.length - max}
        </span>
      ) : null}
    </div>
  );
}

const PROGRESS_COLOR: Record<string, string> = {
  completed: "bg-teal-400",
  on_hold: "bg-amber-300",
  active: "bg-blue-500",
};

export function PmsProgress({
  value,
  status,
}: {
  value: number;
  status?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            PROGRESS_COLOR[status ?? ""] ?? "bg-blue-500"
          )}
          style={{ insetInlineStart: 0, height: "inherit", width: `${value}%` }}
        />
      </div>
      <span
        role="presentation"
        style={{
          clipPath: "inset(50%)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          border: 0,
          padding: 0,
          width: 1,
          height: 1,
          margin: 0,
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        x
      </span>
      <span className="w-9 text-right text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}

export const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-400",
  medium: "text-sky-400",
  low: "text-teal-400",
};

export function PmsPriority({ value, label }: { value: string; label: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 text-sm", PRIORITY_COLOR[value])}>
      <Flag className="size-3.5" />
      <span>{label}</span>
    </div>
  );
}

export function PmsDate({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <Clock className="size-3.5" />
      <span>{text}</span>
    </div>
  );
}

export function PmsLabelChip({ name, color }: { name: string; color?: string }) {
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center rounded-4xl border-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: color ? `${color}1a` : undefined,
        color: color ?? undefined,
      }}
    >
      {name}
    </span>
  );
}

export function PmsOptionGroup({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: string[];
  value: string;
  onPick: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
        {t(title)}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPick(option)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium",
              value === option
                ? "bg-blue-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {t(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PmsSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="mt-6 space-y-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function PmsField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PmsCreateForm({
  fields,
  onSubmit,
  submitLabel,
}: {
  fields: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
  }[];
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label className="text-xs font-medium">{field.name}</label>
          {field.multiline ? (
            <Textarea
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={field.placeholder}
              className="min-h-20 text-sm"
            />
          ) : (
            <Input
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={field.placeholder}
              className="h-9 text-sm"
            />
          )}
        </div>
      ))}
      <Button type="button" className="w-full" onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}
