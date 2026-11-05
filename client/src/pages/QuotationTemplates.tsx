import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/core";
import { PageMeta } from "@/components/layout/PageMeta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuotationTemplateEditor, {
  DEFAULT_QUOTATION_TEMPLATE,
} from "@/components/crm/QuotationTemplateEditor";
import { sampleTemplateData } from "@/lib/quotationFields";
import {
  listQuotationTemplates,
  createQuotationTemplate,
  updateQuotationTemplate,
  deleteQuotationTemplate,
  type QuotationTemplate,
} from "@/api/quotationTemplates";

interface EditingState {
  id?: string;
  name: string;
  layout: JSONContent;
}

export default function QuotationTemplates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuotationTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    try {
      setTemplates(await listQuotationTemplates());
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNew = () =>
    setEditing({ name: t("templates.new"), layout: DEFAULT_QUOTATION_TEMPLATE });

  const handleEdit = (tpl: QuotationTemplate) =>
    setEditing({ id: tpl.id, name: tpl.name, layout: tpl.layout });

  const handleDocChange = (doc: JSONContent) =>
    setEditing((prev) => (prev ? { ...prev, layout: doc } : prev));

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await updateQuotationTemplate(editing.id, {
          name: editing.name,
          layout: editing.layout,
        });
      } else {
        await createQuotationTemplate(editing.name, editing.layout);
      }
      toast.success(t("quotation.saved"));
      setEditing(null);
      await refresh();
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteQuotationTemplate(pendingDelete.id);
      toast.success(t("quotation.saved"));
      setPendingDelete(null);
      await refresh();
    } catch {
      toast.error(t("quotation.loadFailed"));
    }
  };

  if (editing) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageMeta
          title={t("templates.title")}
          actions={
            <>
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {t("common.save")}
              </Button>
            </>
          }
        />
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <Input
            value={editing.name}
            onChange={(e) => setEditing((p) => (p ? { ...p, name: e.target.value } : p))}
            placeholder={t("templates.namePlaceholder")}
            className="max-w-xs"
          />
          <QuotationTemplateEditor
            key={editing.id ?? "new"}
            data={sampleTemplateData()}
            initialDoc={editing.layout}
            onDocChange={handleDocChange}
            className="flex min-h-0 flex-1 flex-col"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageMeta
        title={t("templates.title")}
        actions={
          <Button onClick={handleNew} disabled={loading}>
            {t("templates.new")}
          </Button>
        }
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">{t("auth.loading")}</div>
      ) : templates.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {t("templates.empty")}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col gap-3 p-4">
              <div className="font-heading text-base font-semibold">{tpl.name}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(tpl)}>
                  {t("templates.edit")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPendingDelete(tpl)}>
                  {t("templates.delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("templates.confirmDelete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("templates.confirmDeleteDesc")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmDelete}>{t("templates.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
