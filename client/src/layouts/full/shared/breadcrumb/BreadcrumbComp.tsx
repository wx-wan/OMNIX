import { Card } from "@/components/ui/card";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";


interface BreadcrumbItem {
  to?: string;
  title: string;
}

interface BreadCrumbType {
  subtitle?: string;
  items?: BreadcrumbItem[];
  title: string;
}

const BreadcrumbComp = ({ title }: BreadCrumbType) => {
  const { t } = useTranslation();
  return (
    <>
      <Card
        className={`py-5 px-6 bg-background  overflow-hidden rounded-xl border`}
      >
        <div className="flex items-center justify-between gap-6 relative">
          <h4 className="font-semibold text-xl text-forground">{t(title)}</h4>
          <ol
            className="flex items-center whitespace-nowrap"
            aria-label="Breadcrumb"
          >
            <li className="flex items-center">
              <Link className="text-forground text-sm  leading-none" to="/">
                {t("Home")}
              </Link>
            </li>
            <li className="mx-2">
              <div className="p-0.5 text-forground">/</div>
            </li>
            <li
              className="flex items-center text-sm text-forground leading-none opacity-80"
              aria-current="page"
            >
              {t(title)}
            </li>
          </ol>
        </div>
      </Card>
    </>
  );
};

export default BreadcrumbComp;
