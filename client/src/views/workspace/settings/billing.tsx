import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Plus } from "lucide-react";
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

const INVOICES = [
  { id: "inv_1042", date: "2026/9/1", amount: "$0.00", status: "Paid" },
  { id: "inv_1041", date: "2026/8/1", amount: "$0.00", status: "Paid" },
  { id: "inv_1040", date: "2026/7/1", amount: "$0.00", status: "Paid" },
];

/** /settings/billing — 取证 23-settings-billing.*，弹层态 48-billing-add-card */
export default function SettingsBilling() {
  const { t } = useTranslation();
  const [plan, setPlan] = useState("free");
  const [cardOpen, setCardOpen] = useState(false);

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("Current Plan")}</CardTitle>
            <CardDescription>{t("Your subscription and what's included")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("Free Plan")}</p>
                <p className="text-sm text-muted-foreground">{t("$0/month")}</p>
              </div>
              <Badge>{t("Active")}</Badge>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {["Up to 10 projects", "Up to 5 members", "Basic reporting"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1 rounded-full bg-current" />
                  {t(item)}
                </li>
              ))}
            </ul>
            <Field>
              <Label htmlFor="plan-select">{t("Change plan")}</Label>
              <SettingsSelect
                id="plan-select"
                value={plan}
                onValueChange={setPlan}
                options={["free"]}
                className="w-full"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Payment Methods")}</CardTitle>
            <CardDescription>{t("Used for plan upgrades and renewals")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("No payment methods on file")}
            </p>
            <Button variant="outline" size="sm" onClick={() => setCardOpen(true)}>
              <Plus />
              {t("Add new payment method")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Billing History & Invoices")}</CardTitle>
            <CardDescription>{t("Download receipts for past charges")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">{t("Invoice")}</TableHead>
                  <TableHead>{t("Date")}</TableHead>
                  <TableHead>{t("Amount")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Receipt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INVOICES.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs px-4">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge className="capitalize">{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm">
                        <Download />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add payment method")}</DialogTitle>
            <DialogDescription>{t("Your card is never charged in this demo.")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <Field>
              <Label htmlFor="card-number">{t("Card Number")}</Label>
              <Input id="card-number" name="number" placeholder="4242 4242 4242 4242" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="card-expiry">{t("Expiry")}</Label>
                <Input id="card-expiry" name="expiry" placeholder="MM/YY" />
              </Field>
              <Field>
                <Label htmlFor="card-cvc">{t("CVC")}</Label>
                <Input id="card-cvc" name="cvc" placeholder="123" />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCardOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" onClick={() => setCardOpen(false)}>
                {t("Add card")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}
