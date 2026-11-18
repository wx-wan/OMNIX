import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import Loading from "@/components/shadcn-dashboard/spinner/loading";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Lock,
  Plus,
  Search,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { avatarSrc } from "@/views/apps/shared";
import { roleLabel, useUsers } from "@/api/auth/use-users";
import { presenceStyles } from "@/lib/presence";
import { SettingsLayout, SettingsSelect } from "./index";

// 后端可分配角色值：admin / user / viewer。super_admin 仅 seed 赋值，不接受任何选择，故不在选项内。
const ROLES = ["admin", "user", "viewer"];
// 超级管理员（唯一，默认 admin@omnix.dev）：角色锁定、不可移除，页面只做静态展示。
const SUPER_ADMIN_ROLE = "super_admin";
const isSuperAdmin = (role?: string) => role === SUPER_ADMIN_ROLE;

/** /settings/members — 取证 23-settings-members.*，弹层态 32-members-* */
export default function SettingsMembers() {
  const { t } = useTranslation();
  const { user, presence } = useAuth();
  const isAdmin = user?.role === "admin" || isSuperAdmin(user?.role);
  const { users, isLoading, updateRole, remove } = useUsers();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState("user");

  const filtered = users.filter(
    (member) =>
      (roleFilter === "all" || member.role === roleFilter) &&
      (member.name.toLowerCase().includes(query.toLowerCase()) ||
        member.email.toLowerCase().includes(query.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error((error as Error).message || t("Operation failed"));
    }
  }

  return (
    <SettingsLayout>
      <Card className="w-full gap-0 border border-border py-0 ring-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-3.5">
          <div>
            <CardTitle>{t("Team Members")}</CardTitle>
            <CardDescription>
              {t("{{n}} members in this workspace", { n: users.length })}
            </CardDescription>
          </div>
          <CardAction>
            <Button size="sm" className="cursor-pointer" onClick={() => setInviteOpen(true)}>
              <Plus />
              {t("Invite member")}
            </Button>
          </CardAction>
        </CardHeader>

        <div className="flex flex-wrap items-center justify-between gap-4 border-border p-3.5 border-t">
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="w-56 dark:border-border dark:bg-background">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("Search by name or email")}
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              />
            </InputGroup>
            <SettingsSelect
              value={roleFilter}
              onValueChange={(value) => { setRoleFilter(value); setPage(1); }}
              options={["all", "super_admin", "admin", "user", "viewer"]}
              formatOption={(value) => (value === "all" ? t("All roles") : t(roleLabel(value)))}
              className="w-36 cursor-pointer dark:border-border dark:bg-background"
            />
          </div>
        </div>

        <CardContent className="p-0">
          <Card className="w-full overflow-x-auto rounded-none border-y p-0 ring-0">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent!">
                  <TableHead className="px-3">{t("Member")}</TableHead>
                  <TableHead className="px-3">{t("Role")}</TableHead>
                  <TableHead className="px-3">{t("Department")}</TableHead>
                  <TableHead className="px-3">{t("Join date")}</TableHead>
                  {isAdmin && <TableHead className="w-10 px-3" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="px-3">
                      <Loading className="min-h-24" />
                    </TableCell>
                  </TableRow>
                )}
                {visible.map((member) => {
                  const role = member.role;
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage
                              src={avatarSrc(member.avatarUrl)}
                              alt={member.name}
                            />
                            <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                            <AvatarBadge
                              className={presenceStyles[presence[member.id] ?? "offline"].className}
                            >
                              <span className="sr-only">
                                {t(presenceStyles[presence[member.id] ?? "offline"].label)}
                              </span>
                            </AvatarBadge>
                          </Avatar>
                          <div className="min-w-0">
                            <h6 className="truncate text-sm font-medium">{member.name}</h6>
                            <p className="truncate text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        {isSuperAdmin(role) ? (
                          <span
                            title={t("Super admin role is locked")}
                            className="inline-flex h-8 w-28 cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 text-sm font-medium"
                          >
                            <Lock className="size-3.5 text-muted-foreground" />
                            {t(roleLabel(role))}
                          </span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-28 cursor-pointer justify-between capitalize"
                                />
                              }
                            >
                              <span>{t(roleLabel(role))}</span>
                              <ChevronDown />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {ROLES.map((option) => (
                                <DropdownMenuItem
                                  key={option}
                                  onClick={() =>
                                    void run(
                                      () => updateRole(member.id, option),
                                      t("Role updated"),
                                    )
                                  }
                                >
                                  {t(roleLabel(option))}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm whitespace-nowrap text-muted-foreground">
                        {member.department || "—"}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm whitespace-nowrap text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      {isAdmin && <TableCell className="px-3 py-3">
                        {isSuperAdmin(role) ? null : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${member.name}`}
                                />
                              }
                            >
                              <Ellipsis />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  void run(() => remove(member.id), t("Member removed"))
                                }
                              >
                                {t("Remove")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-none bg-transparent! p-3.5">
          <div className="order-2 flex items-center gap-2 sm:order-1">
            <Label className="font-normal text-muted-foreground">{t("Rows per page")}</Label>
            <SettingsSelect
              value={String(pageSize)}
              onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}
              options={["8", "16", "32"]}
              className="h-8 w-16 cursor-pointer dark:border-border dark:bg-background"
            />
          </div>
          <div className="order-1 flex items-center gap-4 sm:order-2">
            <div className="text-sm text-muted-foreground">
              {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                <Button
                  key={value}
                  variant={value === currentPage ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-current={value === currentPage ? "page" : undefined}
                  aria-label={`Page ${value}`}
                  onClick={() => setPage(value)}
                >
                  {value}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Invite member")}</DialogTitle>
            <DialogDescription>
              {t("Registration is open. Members can create accounts on the sign-up page.")}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
            <Field>
              <Label htmlFor="invite-email">{t("Email")}</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="name@company.com"
              />
            </Field>
            <Field>
              <Label htmlFor="invite-role">{t("Role")}</Label>
              <SettingsSelect
                id="invite-role"
                value={inviteRole}
                onValueChange={setInviteRole}
                options={ROLES}
                formatOption={(value) => t(value)}
                className="w-full"
              />
            </Field>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                onClick={() => {
                  setInviteOpen(false);
                  toast.info(t("Registration is open. Members can create accounts on the sign-up page."));
                }}
              >
                {t("Send invite")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}
