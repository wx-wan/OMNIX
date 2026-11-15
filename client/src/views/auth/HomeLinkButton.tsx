import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

/**
 * 错误页 / 维护页的「Go Back to Home」：按登录态鉴权跳转。
 * 已登录用户回主页，未登录一律送去登录页，避免绕过登录墙。
 */
export default function HomeLinkButton() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const to = user ? "/" : "/login";

  return (
    <Button className="mt-6 mx-auto" render={<Link to={to} />}>
      {t("Go Back to Home")}
    </Button>
  );
}
