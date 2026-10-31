import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/layout/Stack";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";

export default function Settings() {
  const { t } = useTranslation();
  return (
    <Stack gap={6}>
      <PageHeader title={t("nav.settings")} />
      <Section
        title={t("appName")}
        description={t("settings.aboutDesc")}
        action={
          <div className="flex gap-3">
            <Button variant="outline">{t("common.cancel")}</Button>
            <Button>{t("common.save")}</Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">{t("settings.comingSoon")}</p>
      </Section>
    </Stack>
  );
}
