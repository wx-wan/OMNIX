import type { ReactNode } from "react";

/**
 * 事项详情里的「属性表」外壳与行：卡片 + 标题头 + divide-y 标签/值行。
 * 事项详情页与设置页「默认事项」弹窗共用；样式一致，内容逻辑各自实现。
 */
export function PropertiesPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="h-fit rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className="divide-y divide-border px-5">{children}</div>
    </section>
  );
}

export function PropertyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-end">{children}</span>
    </div>
  );
}
