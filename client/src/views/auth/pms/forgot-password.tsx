import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { AuthCard } from "./shared";

async function readError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  return body.message || fallback;
}

/** 忘记密码：演示环境未配置 SMTP，重置码由后端返回后直接展示，无需邮件投递。 */
export default function PmsForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, t("Operation failed")));
      }
      const { token: code } = (await response.json()) as { token: string };
      setToken(code);
      setStep("reset");
      toast.success(t("Reset code generated"));
    } catch (error) {
      toast.error(t((error as Error).message));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("Passwords do not match"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, t("Operation failed")));
      }
      toast.success(t("Password reset. Please log in again."));
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(t((error as Error).message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={t("Reset password")}
      description={t("Enter your account email to get a reset code")}
      linkText={t("Back to login")}
      linkTo="/login"
      headerGapClass="gap-8"
    >
      {step === "request" ? (
        <form onSubmit={requestCode}>
          <FieldGroup className="gap-6">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="reset-email" className="text-sm font-normal text-muted-foreground">
                {t("Account")}
              </FieldLabel>
              <Input
                id="reset-email"
                name="email"
                type="email"
                placeholder={t("Enter your account")}
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-9 shadow-xs dark:bg-background"
              />
            </Field>
            <Button type="submit" disabled={submitting} className="h-10 w-full rounded-lg">
              {submitting ? t("Submitting...") : t("Send reset code")}
            </Button>
          </FieldGroup>
        </form>
      ) : (
        <form onSubmit={submitReset}>
          <FieldGroup className="gap-5">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{t("Demo mode: no email delivery configured")}</p>
              <p className="mt-1 break-all text-muted-foreground">
                {t("Your reset code")}: <span className="font-mono text-foreground">{token}</span>
              </p>
            </div>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="reset-token" className="text-sm font-normal text-muted-foreground">
                {t("Reset code")}
              </FieldLabel>
              <Input
                id="reset-token"
                name="token"
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="h-9 font-mono shadow-xs dark:bg-background"
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="reset-new-password" className="text-sm font-normal text-muted-foreground">
                {t("New password")}
              </FieldLabel>
              <Input
                id="reset-new-password"
                name="newPassword"
                type="password"
                placeholder={t("Enter your password")}
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-9 shadow-xs dark:bg-background"
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="reset-confirm-password" className="text-sm font-normal text-muted-foreground">
                {t("Confirm new password")}
              </FieldLabel>
              <Input
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                placeholder={t("Enter your password again")}
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-9 shadow-xs dark:bg-background"
              />
            </Field>
            <Button type="submit" disabled={submitting} className="h-10 w-full rounded-lg">
              {submitting ? t("Submitting...") : t("Reset password")}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  );
}
