import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Eye, Plus, ShieldAlert, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsLayout } from "./index";

/** /settings/api-keys — 取证 23-settings-api-keys.*，弹层态 48-apikey-generate */
export default function SettingsApiKeys() {
  const { t } = useTranslation();
  const [generateOpen, setGenerateOpen] = useState(false);

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{t("API Keys")}</CardTitle>
              <CardDescription>{t("1 active key for programmatic access")}</CardDescription>
            </div>
            <Button size="sm" className="cursor-pointer" onClick={() => setGenerateOpen(true)}>
              <Plus />
              {t("Generate key")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-300/40 bg-amber-300/10 text-amber-500">
            <ShieldAlert />
            <AlertTitle>{t("Keep your API keys secret")}</AlertTitle>
            <AlertDescription>
              {t(
                "Treat API keys like passwords. Never share them or commit them to source control. Revoke any key you suspect has been exposed."
              )}
            </AlertDescription>
          </Alert>

          <div className="w-full overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Key")}</TableHead>
                  <TableHead>{t("Created")}</TableHead>
                  <TableHead>{t("Last used")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Production</span>
                      <Badge className="border-transparent bg-teal-400/10 text-teal-500">
                        {t("Active")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        omnix_a1b2••••••••k1l2
                      </code>
                      <Button variant="ghost" size="icon-sm" aria-label="Show key">
                        <Eye />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    2026年1月15日
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    2 days ago
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="Copy key">
                        <Copy />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Revoke key"
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Generate API key")}</DialogTitle>
            <DialogDescription>
              {t("Give it a name so you remember what it's used for.")}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <Field>
              <Label htmlFor="key-name">{t("Name")}</Label>
              <Input id="key-name" name="name" placeholder="Production" />
            </Field>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" onClick={() => setGenerateOpen(false)}>
                {t("Generate")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}
