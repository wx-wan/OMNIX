import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Eye } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { avatarSrc } from "@/views/apps/shared";
import { authApi } from "@/api/auth";
import { roleLabel } from "@/api/auth/use-users";
import { useAuth } from "@/context/AuthContext";
import AvatarDemo from "@/components/shadcn-dashboard/avatar/avatar-10";

const NOTIFICATIONS = [
  { title: "Mentions", description: "When someone mentions you in a comment", checked: true },
  { title: "Assignments", description: "When an issue or task is assigned to you", checked: true },
  { title: "Due date reminders", description: "When your work is due soon", checked: true },
  { title: "Weekly digest", description: "A weekly summary of workspace activity", checked: false },
];

const SOCIAL_LINKS = [
  { label: "Twitter / X", id: "social-twitter", name: "twitter", placeholder: "https://x.com/username" },
  { label: "LinkedIn", id: "social-linkedin", name: "linkedin", placeholder: "https://linkedin.com/in/username" },
  { label: "GitHub", id: "social-github", name: "github", placeholder: "https://github.com/username" },
  { label: "Website", id: "social-website", name: "website", placeholder: "https://yoursite.com" },
];

function PasswordField({
  id,
  name,
  labelKey,
  autoComplete,
  value,
  onChange,
}: {
  id: string;
  name: string;
  labelKey: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <Field>
      <Label htmlFor={id}>{t(labelKey)}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder="Password"
          autoComplete={autoComplete}
          className="pr-10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          aria-label="Show password"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Eye className="size-4" />
        </button>
      </div>
    </Field>
  );
}

/** /profile — 1:1 复刻自 pms-audit/dom/11-profile.*（50 行 leaves / 6 张卡 / 4 个 switch） */
export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setAvatarUrl(user.avatarUrl);
  }, [user]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      const next = await authApi.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || "/images/profile/user-1.png",
      });
      updateUser(next);
      if (currentPassword || newPassword) {
        await authApi.changePassword(currentPassword, newPassword);
        setCurrentPassword("");
        setNewPassword("");
      }
      toast.success(t("Profile updated"));
    } catch (error) {
      toast.error((error as Error).message || t("Operation failed"));
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl bg-background p-6">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">{t("Profile")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Manage your personal information")}
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarImage
                  src={avatarSrc(user?.avatarUrl)}
                  alt={user?.name ?? "Profile"}
                />
                <AvatarFallback>{user?.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="absolute -right-0.5 -bottom-0.5 size-4 rounded-full border-2 border-card bg-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-medium">{user?.name ?? "--"}</p>
                <Badge className="border-transparent bg-teal-400/10 text-teal-500 capitalize">
                  {t(roleLabel(user?.role ?? "user"))}
                </Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">{user?.email ?? "--"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "--"} · <span className="capitalize">online</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Personal Info")}</CardTitle>
            <CardDescription>
              {t("Update your name, email, password and avatar")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AvatarDemo
              currentAvatarUrl={user?.avatarUrl}
              initials={user?.name?.[0]?.toUpperCase() ?? "?"}
              onSaved={(url) => {
                setAvatarUrl(url);
                updateUser({ avatarUrl: url });
              }}
            />
            <form className="space-y-4" onSubmit={handleSave}>
              <Field>
                <Label htmlFor="profile-name">{t("Name")}</Label>
                <Input
                  id="profile-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="profile-email">{t("Email")}</Label>
                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                />
              </Field>
              <PasswordField
                id="profile-current-password"
                name="currentPassword"
                labelKey="Current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <PasswordField
                id="profile-new-password"
                name="newPassword"
                labelKey="New password"
                autoComplete="new-password"
                value={newPassword}
                onChange={setNewPassword}
              />
              <Button type="submit">{t("Save changes")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Email Notifications")}</CardTitle>
            <CardDescription>{t("Choose what you get emailed about")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {NOTIFICATIONS.map((item) => (
              <div key={item.title} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t(item.title)}</p>
                  <p className="text-xs text-muted-foreground">{t(item.description)}</p>
                </div>
                <Switch defaultChecked={item.checked} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Social Links")}</CardTitle>
            <CardDescription>{t("Shown on your profile for teammates")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              {SOCIAL_LINKS.map((item) => (
                <Field key={item.id}>
                  <Label htmlFor={item.id}>{t(item.label)}</Label>
                  <Input
                    id={item.id}
                    name={item.name}
                    placeholder={item.placeholder}
                  />
                </Field>
              ))}
              <Button type="submit">{t("Save links")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Teams")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/team?team=t1">
              <Badge variant="outline" className="hover:bg-muted">
                {t("Product")}
              </Badge>
            </Link>
            <Link to="/team?team=t3">
              <Badge variant="outline" className="hover:bg-muted">
                {t("Engineering")}
              </Badge>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">{t("Danger Zone")}</CardTitle>
            <CardDescription>{t("Irreversible actions for your account")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{t("Reset workspace data")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Restores all accounts to their original seed state and signs you out")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                {t("Reset")}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/40 p-3">
              <div>
                <p className="text-sm font-medium">{t("Delete account")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("Permanently remove your account from this workspace")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                {t("Delete account")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Reset workspace data")}</DialogTitle>
            <DialogDescription>
              {t("Restores all accounts to their original seed state and signs you out")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={() => setResetOpen(false)}>{t("Reset")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Delete account")}</DialogTitle>
            <DialogDescription>
              {t("Permanently remove your account from this workspace")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(false)}>
              {t("Delete account")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
