import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useAuth } from "@/context/AuthContext";
import { AuthCard } from "./shared";

const REMEMBERED_EMAIL_KEY = "pms.rememberedEmail";
const REMEMBERED_PASSWORD_KEY = "pms.rememberedPassword";
const REMEMBER_DEVICE_KEY = "pms.rememberDevice";

/** /login — 逐项复刻 pms-audit/raw/page-login.html，表单接后端 /api/auth/login。 */
export default function PmsLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const rememberEnabled = () => localStorage.getItem(REMEMBER_DEVICE_KEY) !== "false";
  const [remember, setRemember] = useState(rememberEnabled);
  const [email, setEmail] = useState(() =>
    rememberEnabled() ? (localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "") : "",
  );
  const [password, setPassword] = useState(() =>
    rememberEnabled() ? (localStorage.getItem(REMEMBERED_PASSWORD_KEY) ?? "") : "",
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password, remember);
      // 记住此设备：本机保存账号与密码供下次自动回填；后端按 remember 下发持久化会话 cookie。
      localStorage.setItem(REMEMBER_DEVICE_KEY, String(remember));
      if (remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
        localStorage.setItem(REMEMBERED_PASSWORD_KEY, password);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
      }
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(t((error as Error).message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title={t("Welcome back")}
      description={t("Don't have an account?")}
      linkText={t("Sign up for free")}
      linkTo="/register"
      headerGapClass="gap-8"
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-8">
          <div className="flex flex-col gap-4">
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="email"
                className="text-sm font-normal text-muted-foreground"
              >
                {t("Account")}
              </FieldLabel>
              <Input
                id="email"
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
            <Field className="gap-1.5">
              <FieldLabel
                htmlFor="password"
                className="text-sm font-normal text-muted-foreground"
              >
                {t("Password")}
              </FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t("Enter your password")}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-9 shadow-xs dark:bg-background"
              />
            </Field>
          </div>

          <Field orientation="horizontal" className="justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                id="terms"
                name="terms"
                checked={remember}
                onCheckedChange={(value) => setRemember(Boolean(value))}
                className="cursor-pointer"
              />
              <FieldLabel
                htmlFor="terms"
                onClick={() => setRemember((value) => !value)}
                className="cursor-pointer text-sm font-normal text-primary"
              >
                {t("Remember this device")}
              </FieldLabel>
            </div>
            <Link to="/forgot-password" className="text-end text-sm font-medium text-card-foreground hover:underline">
              {t("Forgot password?")}
            </Link>
          </Field>

          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full rounded-lg"
          >
            {t("Log in")}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
