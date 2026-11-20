import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import { PmsCard, PmsCell, PmsHeader, PmsRow, type PmsColumn } from "../pms";
import {
  useWorkspaceDefaults,
  updateWorkspaceDefaults,
  type WorkspaceDefaults,
} from "@/api/settings/use-workspace-defaults";
import { StageDefaultItems } from "./stage-default-items";
import { SettingsLayout } from "./index";

const uid = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** 阶段表列宽与 PmsHeader / PmsRow 共用，标题列用 titleContent 承载可编辑 Input。 */
const STAGE_COLUMNS: PmsColumn[] = [
  { label: "Stage", w: "w-40" },
  { label: "English name", w: "w-40" },
  { label: "Description", w: "w-64" },
  { label: "Duration (days)", w: "w-24" },
  { label: "Default items", w: "w-24" },
];
const STAGE_TITLE_W = "w-40 min-w-40";

/** /settings/defaults（首选项）— 项目阶段列表 + 事项默认类型 / 操作。 */
export default function SettingsDefaults() {
  const { t } = useTranslation();
  const { defaults } = useWorkspaceDefaults();
  const [draft, setDraft] = useState<WorkspaceDefaults>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(defaults), [defaults]);

  const setStage = (index: number, patch: Partial<WorkspaceDefaults["stages"][number]>) =>
    setDraft((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)),
    }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateWorkspaceDefaults({
        ...draft,
        stages: draft.stages.map((stage) => ({
          ...stage,
          key: stage.key.trim() || uid(),
          days: stage.days == null || Number.isNaN(stage.days) ? null : Math.max(0, Number(stage.days)),
        })),
      });
      toast.success(t("Saved successfully"));
    } catch {
      toast.error(t("Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("Project stages")}</CardTitle>
            <CardDescription>{t("Stages and durations used by new projects.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PmsCard
              toolbar={
                <>
                  <span className="text-xs text-muted-foreground">
                    {t("N stages", { n: draft.stages.length })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          stages: [
                            ...prev.stages,
                            { key: uid(), en: "New stage", zh: t("New stage"), description: "", days: 7, defaultTasks: [], defaultIssues: [] },
                          ],
                        }))
                      }
                    >
                      <Plus className="size-4" /> {t("Add stage")}
                    </Button>
                    <Button type="button" size="sm" onClick={save} disabled={saving}>
                      {saving ? "…" : t("Save")}
                    </Button>
                  </div>
                </>
              }
            >
              <PmsHeader columns={STAGE_COLUMNS} titleW={STAGE_TITLE_W} showColumnsButton={false} reserveActions />
              {draft.stages.map((stage, index) => (
                <PmsRow
                  key={`${stage.key}-${index}`}
                  title={stage.zh || stage.en}
                  titleW={STAGE_TITLE_W}
                  titleContent={
                    <Input
                      aria-label={t("Stage")}
                      value={stage.zh}
                      onChange={(event) => setStage(index, { zh: event.target.value })}
                    />
                  }
                  cells={
                    <>
                      <PmsCell w="w-40">
                        <Input
                          aria-label={t("English name")}
                          value={stage.en}
                          onChange={(event) => setStage(index, { en: event.target.value })}
                        />
                      </PmsCell>
                      <PmsCell w="w-64">
                        <Input
                          aria-label={t("Description")}
                          value={stage.description ?? ""}
                          onChange={(event) => setStage(index, { description: event.target.value })}
                        />
                      </PmsCell>
                      <PmsCell w="w-24">
                        <Input
                          aria-label={t("Duration (days)")}
                          type="number"
                          min={0}
                          value={stage.days ?? ""}
                          placeholder="—"
                          onChange={(event) =>
                            setStage(index, {
                              days: event.target.value === "" ? null : Number(event.target.value),
                            })
                          }
                        />
                      </PmsCell>
                      <PmsCell w="w-24">
                        <StageDefaultItems
                          stage={stage}
                          onChange={(patch) => setStage(index, patch)}
                          onSave={save}
                          saving={saving}
                        />
                      </PmsCell>
                    </>
                  }
                  actions={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("Remove stage")}
                      onClick={() => setDraft((prev) => ({ ...prev, stages: prev.stages.filter((_, i) => i !== index) }))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
              ))}
            </PmsCard>
          </CardContent>
        </Card>

      </div>
    </SettingsLayout>
  );
}
