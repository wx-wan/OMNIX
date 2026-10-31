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
        title="OMNIX"
        description="React 19 + shadcn/ui（Base UI + Tailwind v4） · NestJS + Prisma + PostgreSQL"
        action={
          <div className="flex gap-3">
            <Button variant="outline">{t("common.cancel")}</Button>
            <Button>{t("common.save")}</Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          更多配置项（语言、主题、通知、安全等）将在此呈现。
        </p>
      </Section>
    </Stack>
  );
}
