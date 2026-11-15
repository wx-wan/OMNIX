import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building, Download } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { SettingsLayout, SettingsSelect } from "./index";

/** /settings/general — 取证 23-settings-general.*，交互态 48-settings-export.* */
export default function SettingsGeneral() {
  const { t } = useTranslation();
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [format, setFormat] = useState("CSV");
  const [exported, setExported] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("Workspace")}</CardTitle>
            <CardDescription>
              {t("General information and defaults for this workspace")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <Field>
                <Label htmlFor="name">{t("Workspace Name")}</Label>
                <Input id="name" name="name" defaultValue="Omnix Workspace" />
              </Field>
              <Field>
                <Label htmlFor="description">{t("Description")}</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue="Product, design and engineering teams building Omnix."
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Label htmlFor="timezone">{t("Timezone")}</Label>
                  <SettingsSelect
                    id="timezone"
                    value={timezone}
                    onValueChange={setTimezone}
                    options={["UTC"]}
                    className="w-full"
                  />
                </Field>
                <Field>
                  <Label htmlFor="dateFormat">{t("Date Format")}</Label>
                  <SettingsSelect
                    id="dateFormat"
                    value={dateFormat}
                    onValueChange={setDateFormat}
                    options={["MM/DD/YYYY"]}
                    className="w-full"
                  />
                </Field>
              </div>
              <Button type="submit">{t("Save")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Workspace Logo")}</CardTitle>
            <CardDescription>{t("Shown in the sidebar and browser tab")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    <Building className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <Field className="flex-1">
                  <Label htmlFor="logo">{t("Logo URL")}</Label>
                  <Input id="logo" name="logo" placeholder="https://..." />
                </Field>
              </div>
              <Button type="submit">{t("Save logo")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Workspace Social Links")}</CardTitle>
            <CardDescription>
              {t("Shown on your workspace's public profile")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <Field>
                <Label htmlFor="ws-twitter">{t("Twitter / X")}</Label>
                <Input id="ws-twitter" name="twitter" placeholder="https://x.com/workspace" />
              </Field>
              <Field>
                <Label htmlFor="ws-linkedin">{t("LinkedIn")}</Label>
                <Input
                  id="ws-linkedin"
                  name="linkedin"
                  placeholder="https://linkedin.com/company/workspace"
                />
              </Field>
              <Field>
                <Label htmlFor="ws-github">{t("GitHub")}</Label>
                <Input id="ws-github" name="github" placeholder="https://github.com/workspace" />
              </Field>
              <Field>
                <Label htmlFor="ws-website">{t("Website")}</Label>
                <Input id="ws-website" name="website" placeholder="https://workspace.com" />
              </Field>
              <Button type="submit">{t("Save links")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Export Workspace data")}</CardTitle>
            <CardDescription>
              {t("Export your workspace data for backup or migration purposes")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SettingsSelect
                ariaLabel={t("Format")}
                value={format}
                onValueChange={setFormat}
                options={["CSV"]}
                className="w-32 cursor-pointer"
              />
              <Button className="cursor-pointer" onClick={() => setExported(true)}>
                <Download />
                {t("Start export")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("Includes All projects · all issues · all tasks")}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4">{t("Type")}</TableHead>
                    <TableHead>{t("Date")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="text-right">{t("Download")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exported ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="px-4">CSV Export</TableCell>
                      <TableCell>2026年11月14日</TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" aria-label="Download export">
                          <Download />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={4}
                        className="px-4 py-6 text-center text-sm text-muted-foreground"
                      >
                        {t("No exports yet. Choose a format and start your first export.")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">{t("Danger zone")}</CardTitle>
            <CardDescription>{t("Leave this workspace")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/40 p-3">
              <div>
                <p className="text-sm font-medium">{t("Leave workspace")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("You'll be signed out and lose access until re-invited")}
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setLeaveOpen(true)}>
                {t("Leave")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Leave workspace")}</DialogTitle>
            <DialogDescription>
              {t("You'll be signed out and lose access until re-invited")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button variant="destructive" onClick={() => setLeaveOpen(false)}>
              {t("Leave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}
