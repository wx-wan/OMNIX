import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Stack } from "@/components/layout/Stack";
import { HeaderAction } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CustomerForm,
  EMPTY_CUSTOMER,
  type CustomerValues,
} from "@/components/crm/CustomerForm";

interface Customer {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  email: string | null;
}

export default function Customers() {
  const { t } = useTranslation();
  const [list, setList] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [values, setValues] = useState<CustomerValues>(EMPTY_CUSTOMER);

  const load = () => {
    api
      .get<Customer[]>("/customers")
      .then((r) => setList(r.data))
      .catch(() => setList([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!values.name.trim() || saving) return;
    setSaving(true);
    try {
      await api.post("/customers", { ...values, name: values.name.trim() });
      setOpen(false);
      setValues(EMPTY_CUSTOMER);
      setError(false);
      load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={4}>
      <HeaderAction>
        <Button
          onClick={() => {
            setError(false);
            setValues(EMPTY_CUSTOMER);
            setOpen(true);
          }}
        >
          <Plus />
          {t("crm.newDeal")}
        </Button>
      </HeaderAction>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("customer.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                {c.company && <span>{c.company}</span>}
                {c.contact && (
                  <span>
                    {c.contact}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </span>
                )}
                {c.industry && <span>{c.industry}</span>}
                {c.email && <span className="truncate">{c.email}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (v) setError(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("customer.panel")}</DialogTitle>
            <DialogDescription>{t("customer.empty")}</DialogDescription>
          </DialogHeader>
          <CustomerForm values={values} onChange={setValues} />
          {error && <p className="text-sm text-red-500">{t("crm.createFailed")}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!values.name.trim() || saving} onClick={handleCreate}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
