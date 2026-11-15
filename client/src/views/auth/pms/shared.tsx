import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import loginBg from "@/assets/images/backgrounds/login-5.webp";
import omnixIcon from "@/assets/images/logos/omnix-icon.png";

/**
 * 登录/注册页公共外壳，逐项取自 pms-audit/raw/page-login.html 与 page-register.html：
 * section(背景) > div(min-h-screen) > div(max-w-7xl) > Card(max-w-md, rounded-3xl)
 * > CardHeader(P + PMS 品牌 / 标题 / 描述) > CardContent(form + Demo 卡)。
 * 背景图与第三方图标改为本地静态资源，避免依赖线上外链。
 */
export function AuthCard({
  title,
  description,
  linkText,
  linkTo,
  headerGapClass,
  children,
  footer,
}: {
  title: string;
  description: string;
  linkText: string;
  linkTo: string;
  headerGapClass: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section
      className="h-full min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="flex min-h-screen items-end justify-center sm:items-center lg:justify-start">
        <div className="mx-auto w-full max-w-7xl p-4 py-8 sm:py-16 lg:px-8 lg:py-20 xl:px-16">
          <Card className="h-full w-full max-w-md gap-6 rounded-3xl border-none px-6 py-8 shadow-none sm:gap-8 sm:px-8 sm:py-12">
            <CardHeader className={`flex flex-col p-0 ${headerGapClass}`}>
              <Link aria-label="Omnix" to="/" className="flex items-center gap-3">
                <img src={omnixIcon} alt="Omnix" className="h-10 w-auto" />
                <span className="text-lg font-semibold">Omnix</span>
              </Link>
              <div className="flex flex-col gap-1">
                <CardTitle className="font-heading text-2xl font-semibold">{title}</CardTitle>
                <CardDescription className="text-sm font-normal text-muted-foreground">
                  {description}{" "}
                  <Link to={linkTo} className="font-medium text-blue-500 no-underline!">
                    {linkText}
                  </Link>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {children}
              {footer}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
