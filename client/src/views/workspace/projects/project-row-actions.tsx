import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  ArrowUpRight,
  Check,
  CircleDot,
  Copy,
  ExternalLink,
  Link2,
  MoreHorizontal,
  MoveRight,
  SquareCheck,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  STAGES,
  deleteProject,
  setProjectStage,
  stageLabel,
  updateProject,
  type StageKey,
} from "@/api/workspace/project-stages";
import type { WsProject } from "src/types/apps/workspace";

export function ProjectRowActions({
  project,
  currentStage,
  zh,
}: {
  project: WsProject;
  currentStage: StageKey;
  zh: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const href = `/projects/${project.id}`;

  const copy = (value: string) => {
    void navigator.clipboard?.writeText(value).catch(() => {});
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${project.name}`}
        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground outline-none hover:bg-muted hover:text-foreground data-popup-open:bg-muted"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => copy(`${window.location.origin}${href}`)}>
          <Link2 />
          {t("Copy link")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copy(project.id)}>
          <Copy />
          {t("Copy ID")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(href, "_blank", "noopener,noreferrer")}>
          <ExternalLink />
          {t("Open in new tab")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(href)}>
          <ArrowUpRight />
          {t("Open project")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MoveRight />
            {t("Move to")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {STAGES.map((stage) => (
              <DropdownMenuItem
                key={stage.key}
                onClick={() => setProjectStage(project.id, stage.key)}
              >
                <span className="flex size-4 items-center justify-center">
                  {stage.key === currentStage ? <Check className="size-4" /> : null}
                </span>
                {stageLabel(stage.key, zh)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => updateProject(project.id, { status: "completed" })}>
          <SquareCheck />
          {t("Mark as completed")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateProject(project.id, { status: "active" })}>
          <CircleDot />
          {t("Active project")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={() => deleteProject(project.id)}>
          <Trash2 />
          {t("Delete project")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
