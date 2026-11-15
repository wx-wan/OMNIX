import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ClipboardList } from "lucide-react";
import {
  STAGES,
  stageLabel,
  type StageKey,
} from "src/api/workspace/project-stages";

/** 九个阶段的表单占位页：导航可达，字段后续补充。 */
export default function RequirementStagePage() {
  const { stage = "requirement" } = useParams();
  const { i18n } = useTranslation();
  const zh = i18n.language === "ch";
  const current = (STAGES.find((item) => item.key === stage)?.key ??
    "requirement") as StageKey;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <Link
        to="/projects"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        {zh ? "返回项目列表" : "Back to Projects"}
      </Link>

      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">
          {stageLabel(current, zh)} {zh ? "表单" : "Form"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {zh ? "该阶段需要补充的字段将在下一步接入" : "Fields for this stage will be added in the next step"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STAGES.map((item, index) => (
          <Link
            key={item.key}
            to={`/apps/requirements/${item.key}`}
            className={
              item.key === current
                ? "inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-500 px-3 text-xs font-medium text-white"
                : "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted"
            }
          >
            <span className="text-[10px] opacity-70">
              {String(index + 1).padStart(2, "0")}
            </span>
            {stageLabel(item.key, zh)}
          </Link>
        ))}
      </div>

      <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-10">
        <span className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
          <ClipboardList className="size-6" />
        </span>
        <p className="text-sm font-medium">
          {stageLabel(current, zh)} {zh ? "· 表单待补充" : "· form coming soon"}
        </p>
        <Link
          to="/projects"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {zh ? "返回项目列表" : "Back to Projects"}
        </Link>
      </div>
    </div>
  );
}
