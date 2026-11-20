import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import {
  ItemAssigneeMenu,
  ItemPriorityMenu,
  ItemStatusMenu,
} from "./item-fields";

/**
 * 阶段详情（需求详情）事项表格。
 * 类型 / 操作由首选项里各阶段的默认事项配置静默决定，不在表中展示或编辑；
 * 表内只列事项 / 状态 / 优先级 / 经办人 + 分组头 + 底部添加行。
 */
export type ItemsTableRow = {
  id: string;
  /** 事项来源：任务 / 问题；写入逻辑由调用方按此区分。 */
  kind: "task" | "issue";
  title: string;
  no: string;
  type?: string | null;
  action?: string | null;
  status: string;
  priority: string;
  assigneeId?: string | null;
  onOpen?: () => void;
};

export type ItemsTableGroup = {
  key: string;
  title: string;
  hint: string;
  items: ItemsTableRow[];
};

export function ItemsTable({
  groups,
  onStatus,
  onPriority,
  onAssignee,
  onAddIssue,
  onAddTask,
  renderTitle,
  emptyText,
}: {
  groups: ItemsTableGroup[];
  onStatus: (row: ItemsTableRow, status: string) => void;
  onPriority: (row: ItemsTableRow, priority: string) => void;
  onAssignee: (row: ItemsTableRow, assigneeId: string | null) => void;
  onAddIssue?: () => void;
  onAddTask?: () => void;
  renderTitle?: (row: ItemsTableRow) => ReactNode;
  emptyText?: string;
}) {
  const { t } = useTranslation();
  const hasItems = groups.some((group) => group.items.length > 0);

  return (
    <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-sm font-medium text-foreground">
            <th className="px-3 py-3 text-left font-medium">{t("Item")}</th>
            <th className="px-3 py-3 text-left font-medium">{t("Status")}</th>
            <th className="px-3 py-3 text-left font-medium">{t("Priority")}</th>
            <th className="px-3 py-3 text-left font-medium">{t("Assignee")}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) =>
            group.items.length ? (
              <GroupRows
                key={group.key}
                title={group.title}
                hint={group.hint}
                items={group.items}
                onStatus={onStatus}
                onPriority={onPriority}
                onAssignee={onAssignee}
                renderTitle={renderTitle}
              />
            ) : null
          )}
          {!hasItems ? (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                {emptyText ?? t("No items")}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {onAddIssue || onAddTask ? (
        <div className="flex items-center gap-4 border-t border-border px-3 py-2.5">
          {onAddIssue ? (
            <button
              type="button"
              onClick={onAddIssue}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" />
              {t("Add Issue")}
            </button>
          ) : null}
          {onAddTask ? (
            <button
              type="button"
              onClick={onAddTask}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" />
              {t("Add Task")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GroupRows({
  title,
  hint,
  items,
  onStatus,
  onPriority,
  onAssignee,
  renderTitle,
}: {
  title: string;
  hint: string;
  items: ItemsTableRow[];
  onStatus: (row: ItemsTableRow, status: string) => void;
  onPriority: (row: ItemsTableRow, priority: string) => void;
  onAssignee: (row: ItemsTableRow, assigneeId: string | null) => void;
  renderTitle?: (row: ItemsTableRow) => ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-border bg-muted/30">
        <td colSpan={4} className="px-3 py-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{title}</span> {items.length} · {hint}
        </td>
      </tr>
      {items.map((row) => (
        <tr key={row.id} className="border-b border-border last:border-0">
          <td className="px-3 py-3">
            {renderTitle ? (
              renderTitle(row)
            ) : (
              <button
                type="button"
                onClick={row.onOpen}
                className="text-start text-sm font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              >
                {row.title}
              </button>
            )}
            <p className="text-xs text-muted-foreground">{row.no}</p>
          </td>
          <td className="px-3 py-3">
            <ItemStatusMenu value={row.status} onChange={(status) => onStatus(row, status)} />
          </td>
          <td className="px-3 py-3">
            <ItemPriorityMenu value={row.priority} onChange={(priority) => onPriority(row, priority)} />
          </td>
          <td className="px-3 py-3">
            <ItemAssigneeMenu value={row.assigneeId ?? null} onChange={(assigneeId) => onAssignee(row, assigneeId)} />
          </td>
        </tr>
      ))}
    </>
  );
}
