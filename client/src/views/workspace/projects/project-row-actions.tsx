import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Archive,
  ArrowUpRight,
  Check,
  CircleCheck,
  CircleDot,
  Copy,
  CopyPlus,
  ExternalLink,
  Link2,
  MoreHorizontal,
  MoveRight,
  PauseCircle,
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
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import {
  archiveProject,
  createProject,
  deleteProject,
  updateProject,
  type StageKey,
} from "@/api/workspace/project-stages";
import type { WsProject } from "src/types/apps/workspace";

/**
 * 项目状态映射：子菜单（标记为）与列表行首 icon 共用同一份定义。
 * Active = 进行中蓝色 CircleDot，列表行首 icon 随状态切换。
 */
export const STATUS_ITEMS = [
  { value: "active", label: "Active", icon: CircleDot, tone: "text-blue-500" },
  { value: "on_hold", label: "On hold", icon: PauseCircle, tone: "text-amber-500" },
  { value: "completed", label: "Completed", icon: CircleCheck, tone: "text-emerald-500" },
] as const;

/** 由项目状态取行首 icon 与配色（未知状态回退到进行中蓝色）。 */
export const statusVisual = (status?: string | null) =>
  STATUS_ITEMS.find((item) => item.value === status) ?? STATUS_ITEMS[0];

export function ProjectRowActions({
  project,
  currentStage,
}: {
  project: WsProject;
  currentStage: StageKey;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const href = `/projects/${project.id}`;

  const copy = async (value: string, messageKey: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t(messageKey));
    } catch {
      toast.error(t("Operation failed"));
    }
  };

  /** 创建副本：复制名称 / 描述 / 状态 / 优先级 / 到期日与当前阶段，名称加「副本」，并直接打开新项目。 */
  const duplicate = async () => {
    const created = await createProject(
      `${project.name}${t("CopySuffix")}`,
      project.description,
      currentStage,
      {
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
      }
    );
    toast.success(t("Project created"));
    navigate(`/projects/${created.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${project.name}`}
        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground outline-none hover:bg-muted hover:text-foreground data-popup-open:bg-muted"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => copy(`${window.location.origin}${href}`, "Link copied")}>
          <Link2 />
          {t("Copy link")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copy(project.id, "ID copied")}>
          <Copy />
          {t("Copy ID")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(href, "_blank", "noopener,noreferrer")}>
          <ExternalLink />
          {t("Open in new tab")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

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
          <DropdownMenuSubContent side="left" className="w-48">
            {STATUS_ITEMS.map(({ value, label, icon: Icon, tone }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => {
                  void updateProject(project.id, { status: value }).then(() =>
                    toast.success(t("Saved successfully"))
                  );
                }}
              >
                <Icon className={`size-4 ${tone}`} />
                {t(label)}
                {project.status === value ? <Check className="ml-auto size-4" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={duplicate}>
          <CopyPlus />
          {t("Duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            void updateProject(project.id, { status: "completed" }).then(() =>
              toast.success(t("Saved successfully"))
            );
          }}
        >
          <SquareCheck />
          {t("Mark as completed")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            void archiveProject(project.id).then(() => toast.success(t("Project archived")));
          }}
        >
          <Archive />
          {t("Archive project")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void deleteProject(project.id).then(() => toast.success(t("Project deleted")));
          }}
        >
          <Trash2 />
          {t("Delete project")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
