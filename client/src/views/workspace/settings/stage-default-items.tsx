import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ListChecks, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LargeDialog } from "@/components/shadcn-dashboard/dialog/large-dialog";
import type { StageDefaultItem, WorkspaceStageDefault } from "@/api/settings/use-workspace-defaults";
import {
  PmsCard,
  PmsCell,
  PmsGroup,
  PmsHeader,
  PmsRow,
  type PmsColumn,
} from "../pms";
import {
  ItemPriorityMenu,
  ItemStatusMenu,
  ItemTypeMenu,
} from "../item-fields";
import { ItemActionMenu } from "../item-actions";
import { PositionSelect } from "../position-select";

const blank = (): StageDefaultItem => ({ title: "", description: "" });

/** 默认事项表列宽：与 PmsHeader / PmsRow 共用，标题列用 titleContent 承载可编辑 Input。 */
const ITEM_COLUMNS: PmsColumn[] = [
  { label: "Item", w: "w-56" },
  { label: "Type", w: "w-28" },
  { label: "Actions", w: "w-40" },
  { label: "Status", w: "w-32" },
  { label: "Priority", w: "w-32" },
  { label: "Position", w: "w-32" },
];
const ITEM_TITLE_W = "w-56 min-w-56";

/** 单个阶段的默认任务 / 问题编辑器：用 Pms* 表格，编辑走外层 draft，保存同步后端。 */
export function StageDefaultItems({
  stage,
  onChange,
  onSave,
  saving = false,
}: {
  stage: WorkspaceStageDefault;
  onChange: (patch: Partial<WorkspaceStageDefault>) => void;
  onSave: () => Promise<void>;
  saving?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const save = async () => {
    await onSave();
    setOpen(false);
  };

  const tasks = stage.defaultTasks ?? [];
  const issues = stage.defaultIssues ?? [];
  const total = tasks.length + issues.length;

  const setItems = (kind: "defaultTasks" | "defaultIssues", next: StageDefaultItem[]) =>
    onChange({ [kind]: next });

  const patch = (
    kind: "defaultTasks" | "defaultIssues",
    index: number,
    change: Partial<StageDefaultItem>
  ) =>
    setItems(
      kind,
      (stage[kind] ?? []).map((item, idx) => (idx === index ? { ...item, ...change } : item))
    );

  /** 一行默认事项：标题可编辑，类型/操作可改，状态/优先级/经办人按事项表样式显示。 */
  const renderRow = (kind: "defaultTasks" | "defaultIssues", item: StageDefaultItem, index: number) => (
    <PmsRow
      key={`${kind}-${index}`}
      title={item.title || t("Untitled")}
      titleW={ITEM_TITLE_W}
      titleContent={
        <Input
          aria-label={t("Title")}
          value={item.title}
          placeholder={t("Title")}
          onChange={(event) => patch(kind, index, { title: event.target.value })}
        />
      }
      cells={
        <>
          <PmsCell w="w-28">
            <ItemTypeMenu
              value={item.type ?? "output"}
              onChange={(type) => patch(kind, index, { type })}
            />
          </PmsCell>
          <PmsCell w="w-40">
            <ItemActionMenu
              type={item.type}
              value={item.action}
              onChange={(action) => patch(kind, index, { action })}
            />
          </PmsCell>
          <PmsCell w="w-32">
            <ItemStatusMenu value="todo" onChange={() => {}} />
          </PmsCell>
          <PmsCell w="w-32">
            <ItemPriorityMenu value="medium" onChange={() => {}} />
          </PmsCell>
          <PmsCell w="w-32">
            <PositionSelect
              value={item.assigneeRole}
              onChange={(position) => patch(kind, index, { assigneeRole: position })}
            />
          </PmsCell>
        </>
      }
      actions={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Remove")}
          onClick={() => setItems(kind, (stage[kind] ?? []).filter((_, i) => i !== index))}
        >
          <Trash2 className="size-4" />
        </Button>
      }
    />
  );

  return (
    <LargeDialog
      open={open}
      onOpenChange={setOpen}
      title={stage.zh || stage.en}
      description={t("Default tasks and issues created for this stage in new projects.")}
      triggerLabel={t("Default items")}
      trigger={
        <>
          <ListChecks className="size-4" />
          {total > 0 ? (
            <span className="absolute -top-1 -end-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] leading-none text-primary-foreground">
              {total}
            </span>
          ) : null}
        </>
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "…" : t("Save")}
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col">
        <PmsCard>
          <PmsHeader columns={ITEM_COLUMNS} titleW={ITEM_TITLE_W} showColumnsButton={false} reserveActions />
          <PmsGroup
            label="Default tasks"
            count={tasks.length}
            onAdd={() => setItems("defaultTasks", [...tasks, blank()])}
            addLabel={t("Add Task")}
          >
            {tasks.map((item, index) => renderRow("defaultTasks", item, index))}
          </PmsGroup>
          <PmsGroup
            label="Default issues"
            count={issues.length}
            onAdd={() => setItems("defaultIssues", [...issues, blank()])}
            addLabel={t("Add Issue")}
          >
            {issues.map((item, index) => renderRow("defaultIssues", item, index))}
          </PmsGroup>
        </PmsCard>
      </div>
    </LargeDialog>
  );
}
