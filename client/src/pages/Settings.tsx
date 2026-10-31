import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("nav.settings")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>OMNIX</CardTitle>
          <CardDescription>
            React 19 + shadcn/ui（Base UI + Tailwind v4） · NestJS + Prisma + PostgreSQL
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline">{t("common.cancel")}</Button>
          <Button>{t("common.save")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
