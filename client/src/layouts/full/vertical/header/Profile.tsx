import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "src/components/ui/avatar";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { avatarSrc } from "@/views/apps/shared";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@/components/shadcn-dashboard/dropdown-menu/dropdown-menu-01";
import { presenceStyles } from "@/lib/presence";

export default function ProfileSheet() {
  const { t } = useTranslation();
  const { user, logout, myPresence } = useAuth();
  const navigate = useNavigate();

  const avatar = avatarSrc(user?.avatarUrl);
  const initials = user?.name?.[0]?.toUpperCase() || "?";

  const handleLogout = () => {
    logout()
      .catch(() => undefined)
      .finally(() => navigate("/login", { replace: true }));
  };

  /** 菜单项与 block 的默认 label 对应，接入真实导航与登出。 */
  const handleSelect = (label: string) => {
    switch (label) {
      case "My Profile":
        navigate("/profile");
        break;
      case "Account Settings":
        navigate("/settings/general");
        break;
      case "My Subscription":
      case "My Invoice":
        toast.info(t("This section is not available yet."));
        break;
      case "Signout":
        handleLogout();
        break;
    }
  };

  return (
    <Dropdown
      align="end"
      labelOf={t}
      onSelect={handleSelect}
      user={{
        name: user?.name ?? "--",
        email: user?.email ?? "--",
        avatar,
        initials,
        online: myPresence === "online",
      }}
      trigger={
        <Avatar className="size-10 cursor-pointer">
          <AvatarImage src={avatar} alt={user?.name ?? "profile"} />
          <AvatarFallback>{initials}</AvatarFallback>
          <AvatarBadge className={presenceStyles[myPresence].className} />
        </Avatar>
      }
    />
  );
}
