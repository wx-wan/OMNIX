import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import gmail from "src/assets/images/inetegrationpage/Gmail.svg";
import googleMeet from "src/assets/images/inetegrationpage/Google Meet.svg";
import zoom from "src/assets/images/inetegrationpage/Zoom.svg";
import loom from "src/assets/images/inetegrationpage/Loom.svg";
import jira from "src/assets/images/inetegrationpage/Jira.svg";
import linear from "src/assets/images/inetegrationpage/Linear.svg";
import trello from "src/assets/images/inetegrationpage/Trello.svg";
import notion from "src/assets/images/inetegrationpage/Notion.svg";
import mailchimp from "src/assets/images/inetegrationpage/Mailchimp.svg";
import { SettingsLayout } from "./index";

const CATEGORIES = [
  "All",
  "Connected",
  "Communication",
  "Project management",
  "Docs",
  "Marketing",
] as const;

const INTEGRATIONS = [
  { name: "Gmail", description: "Get issue and mention notifications in your inbox", category: "Communication", logo: gmail },
  { name: "Google Meet", description: "Start a meeting straight from an issue", category: "Communication", logo: googleMeet },
  { name: "Zoom", description: "Start calls and attach recordings to issues", category: "Communication", logo: zoom },
  { name: "Loom", description: "Attach async video updates to issues", category: "Communication", logo: loom },
  { name: "Jira", description: "Import and sync issues with Jira", category: "Project management", logo: jira },
  { name: "Linear", description: "Two-way sync issues with Linear", category: "Project management", logo: linear },
  { name: "Trello", description: "Import boards and cards from Trello", category: "Project management", logo: trello },
  { name: "Notion", description: "Link docs and wiki pages to projects", category: "Docs", logo: notion },
  { name: "Mailchimp", description: "Send product updates to your audience", category: "Marketing", logo: mailchimp },
];

/** /settings/integrations — 取证 23-settings-integrations.*，空结果态 44-integrations */
export default function SettingsIntegrations() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const visible = INTEGRATIONS.filter((item) => {
    if (category === "Connected") return false;
    if (category !== "All" && item.category !== category) return false;
    return (
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <SettingsLayout>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t("Integrations")}</h2>
          <p className="text-sm text-muted-foreground">{t("0 of 9 tools connected")}</p>
        </div>

        <Card className="w-full gap-0 border border-border py-0 ring-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-border p-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              {CATEGORIES.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={category === item ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setCategory(item)}
                >
                  {t(item)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <SearchField
                containerClassName="w-full sm:w-60"
                placeholder={t("Search integrations")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <CardContent className="p-0">
            <Card className="overflow-hidden rounded-none border-y p-0 ring-0">
              <div className="grid gap-6 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((item) => (
                  <Card
                    key={item.name}
                    className="h-full gap-0 rounded-2xl py-0 duration-300 hover:shadow-md"
                  >
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background p-2">
                          <img
                            src={item.logo}
                            alt={`${item.name} logo`}
                            className="size-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-medium">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t(item.description)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t(item.category)}
                        </span>
                        <Button size="sm" className="cursor-pointer">
                          <Plus />
                          {t("Connect")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {visible.length === 0 ? (
                  <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    {t("No integrations found")}
                  </div>
                ) : null}
              </div>
            </Card>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
