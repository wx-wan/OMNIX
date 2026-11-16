import { useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetFooter,
  SheetClose,
} from "src/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from "src/components/ui/avatar";
import { Button } from "src/components/ui/button";
import { Check } from "lucide-react";
import { Icon } from "@iconify/react";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";

import { cn } from "src/lib/utils";
import { Mailbox } from 'lucide-react';

import { profileDD } from "./data";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { avatarSrc } from "@/views/apps/shared";
import type { PresenceStatus } from "@/api/auth";
import { presenceStyles, PRESENCE_STATUSES } from "@/lib/presence";
import Buynow from '@/assets/images/backgrounds/sidebarbuynow.svg';

export default function ProfileSheet() {
  const { t } = useTranslation();
  const { user, logout, myPresence, setMyPresence } = useAuth();
  const navigate = useNavigate();
  const avatar = avatarSrc(user?.avatarUrl);
  const initials = user?.name?.[0]?.toUpperCase() || "?";
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  async function changeStatus(next: PresenceStatus) {
    setStatusMenuOpen(false);
    try {
      await setMyPresence(next);
    } catch {
      toast.error(t("Operation failed"));
    }
  }

  const handleLogout = () => {
    logout()
      .catch(() => undefined)
      .finally(() => navigate('/login', { replace: true }));
  };

  return (
    <Sheet>
      {/* Trigger Button */}
      <SheetTrigger className="cursor-pointer hover:bg-primary/5 flex items-center justify-center rounded-full h-10 w-10">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatar} alt={user?.name ?? "profile"} />
          <AvatarFallback>{initials}</AvatarFallback>
          <AvatarBadge className={presenceStyles[myPresence].className}>
            <span className="sr-only">{t(presenceStyles[myPresence].label)}</span>
          </AvatarBadge>
        </Avatar>
      </SheetTrigger>

      {/* Drawer Panel */}
      <SheetContent
        showCloseButton={false}
        side="right"
        className="border-s-0 w-full sm:max-w-80 max-w-60"
      >
        <SheetClose className="absolute top-5 end-5 p-2 hover:bg-primary/5 hover:text-primary rounded-full">
          <Icon icon="tabler:x" width={20} height={20} />
        </SheetClose>
        {/* Top Profile Section */}
        <div className="p-6 py-6">
          <div className="flex flex-col gap-4 justify-center items-center pt-10">
            <div className="relative">
              <button
                type="button"
                aria-label={t("Status")}
                aria-expanded={statusMenuOpen}
                onClick={() => setStatusMenuOpen((open) => !open)}
                className="relative rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={avatar}
                    alt={user?.name ?? "Profile"}
                    width={30}
                    height={30}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                  <AvatarBadge className={cn(presenceStyles[myPresence].className, "size-4 ring-[3px]")} />
                </Avatar>
              </button>
              {statusMenuOpen && (
                <div
                  role="menu"
                  aria-label={t("Status")}
                  className="absolute left-1/2 top-full z-50 mt-2 w-44 -translate-x-1/2 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
                >
                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {t("Status")}
                  </p>
                  {PRESENCE_STATUSES.map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={myPresence === key}
                      onClick={() => void changeStatus(key)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent",
                        myPresence === key && "bg-accent/60",
                      )}
                    >
                      <span className={cn("size-2 rounded-full", presenceStyles[key].className)} aria-hidden="true" />
                      <span className="flex-1 text-start">{t(presenceStyles[key].label)}</span>
                      {myPresence === key && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center">
              <h6 className="text-lg font-semibold">{user?.name ?? "--"}</h6>
              <div className="flex items-center gap-2 justify-center">
                <Mailbox
                  size={18} className="text-muted-foreground"
                />
                <span className="text-sm font-normal text-muted-foreground">
                  {user?.email ?? "--"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="border-t  border-border">
          <ul className="flex flex-col gap-2 p-6">
            {profileDD.map((item) => (
              <li key={item.title} className="group">
                <Link
                  to={item.href}
                  className={cn(
                    "flex gap-3 py-2 px-3 rounded-md group-hover:bg-primary/5 text-muted-foreground"
                  )}
                >
                  <item.avatar
                    width={20}
                    height={20}
                    className="group-hover:text-primary"
                  />

                  <div className="flex gap-3 items-center">
                    <h6 className="text-sm group-hover:text-primary">
                      {t(item.title)}
                    </h6>

                    {item.badge && (
                      <span className="h-5 w-6 text-sm flex justify-center items-center text-primary rounded-sm bg-primary/5">
                        4
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer：仅保留插画与登出（推广文案已按用户要求删除） */}
        <SheetFooter className="px-0 pb-6">
          <div className="border-t border-border w-full">
            <div className="rounded-sm pt-6 flex flex-col justify-center items-center gap-3">
              <div>
                <img
                  src={Buynow}
                  alt="login-bg"
                />
              </div>

              <Button
                variant="secondary"
                onClick={handleLogout}
                className="text-primary"
              >
                {t("Log Out")}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
