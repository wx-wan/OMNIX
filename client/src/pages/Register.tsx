import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Boxes, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { t } = useTranslation();
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      toast.error(t("auth.emailInvalid"));
      return;
    }
    if (name.trim().length < 2) {
      toast.error(t("auth.nameTooShort"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.passwordTooShort"));
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), name.trim(), password);
      toast.success(t("auth.registerSuccess"));
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string | string[] } };
      };
      const status = e.response?.status;
      if (status === 409) {
        toast.error(t("auth.emailExists"));
      } else if (!status || status === 404) {
        toast.error(t("auth.serverUnreachable"));
      } else {
        const msg = Array.isArray(e.response?.data?.message)
          ? e.response.data.message.join("；")
          : e.response?.data?.message;
        toast.error(msg ? `${t("auth.serverError")}：${msg}` : t("auth.serverError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-6" />
          </div>
          <CardTitle className="text-lg">{t("auth.registerTitle")}</CardTitle>
          <CardDescription>{t("appName")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="张三"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-1">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t("auth.register")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t("auth.goLogin")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
