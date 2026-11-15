import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useAuth } from "@/context/AuthContext";
import { AuthCard } from "./shared";

/** /register — 逐项复刻 pms-audit/raw/page-register.html，表单接后端 /api/auth/register。 */
export default function PmsRegister() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      // 注册接口同时写入 session，无需再调用一次登录。
      await register(name.trim(), email.trim(), password);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(t((error as Error).message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={t("Create an account")}
      description={t("Already have an account?")}
      linkText={t("Sign in")}
      linkTo="/login"
      headerGapClass="gap-6 sm:gap-8"
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-8">
          <div className="flex flex-col gap-4">
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="name"
                className="text-sm font-normal text-muted-foreground"
              >
                {t("Name*")}
              </FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                minLength={2}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-9 shadow-xs dark:bg-background"
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="email"
                className="text-sm font-normal text-muted-foreground"
              >
                {t("Email*")}
              </FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@pms.com"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-9 shadow-xs dark:bg-background"
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="password"
                className="text-sm font-normal text-muted-foreground"
              >
                {t("Password*")}
              </FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="at least 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-9 shadow-xs dark:bg-background"
              />
            </Field>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-lg"
          >
            {t("Sign up")}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
