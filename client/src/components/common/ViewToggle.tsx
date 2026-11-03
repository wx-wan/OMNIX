import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "list";

/** 卡片 / 列表 视图切换开关（分段控件样式） */
export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="卡片视图"
        title="卡片视图"
        className={
          value === "grid"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="列表视图"
        title="列表视图"
        className={
          value === "list"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }
        onClick={() => onChange("list")}
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
