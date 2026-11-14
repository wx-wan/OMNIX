import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "src/lib/utils";
import SidebarContent, { ChildItem, MenuItem } from "../vertical/sidebar/sidebaritems";

/**
 * L1 · 水平导航菜单
 *
 * 线上 demo 在 ?layout=horizontal 时顶栏第二行是一个 cn-menubar，
 * 8 个 cn-menubar-trigger：Dashboard / Apps / Ui / Widgets / Pages /
 * Forms / Charts / Tables，每个带下拉。这里复用免费版 sidebaritems
 * 的 heading，按语义合并成线上这 8 组。
 * 分组标签与链接名走导航层 i18n。
 */

const GROUPS: { label: string; headings: string[] }[] = [
  { label: "Dashboard", headings: ["Dashboard"] },
  { label: "Apps", headings: ["Apps", "Home"] },
  { label: "Ui", headings: ["UI ELEMENTS"] },
  { label: "Widgets", headings: ["Widgets"] },
  { label: "Pages", headings: ["Pages", "PRO Pages", "Icons", "Auth"] },
  { label: "Forms", headings: ["FORM ELEMENTS"] },
  { label: "Charts", headings: ["Charts"] },
  { label: "Tables", headings: ["TABLES"] },
];

type NavLink = { name: string; url: string };

function flatten(items: ChildItem[] = [], depth = 0): NavLink[] {
  const out: NavLink[] = [];
  for (const item of items) {
    if (item.url) out.push({ name: item.name, url: item.url });
    if (item.items && depth < 2) out.push(...flatten(item.items, depth + 1));
  }
  return out;
}

const HorizontalNav = () => {
  const [open, setOpen] = useState<number | null>(null);
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const groups = GROUPS.map((group) => {
    const links = SidebarContent.filter(
      (section: MenuItem) => section.heading && group.headings.includes(section.heading)
    ).flatMap((section) => flatten(section.items));
    // sidebaritems 里有同名 heading（Auth / Apps 各出现两次），按 url 去重
    const seen = new Set<string>();
    return {
      label: group.label,
      links: links.filter((link) => {
        if (seen.has(link.url)) return false;
        seen.add(link.url);
        return true;
      }),
    };
  });

  return (
    <div className="w-full border-b border-border bg-background">
      <div className="container mx-auto flex flex-wrap items-center gap-1 px-2 py-2">
        {groups.map((group, index) => {
          const active = group.links.some((link) => link.url === pathname);
          return (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpen(index)}
              onMouseLeave={() => setOpen(null)}
            >
              <button
                type="button"
                data-horizontal-menu={group.label}
                aria-expanded={open === index}
                onClick={() => setOpen(open === index ? null : index)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                  active || open === index
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/5 hover:text-primary"
                )}
              >
                {t(group.label)}
                <ChevronDown className="size-3.5" />
              </button>

              {open === index && group.links.length > 0 && (
                <div
                  data-horizontal-dropdown
                  className="absolute top-full start-0 z-50 max-h-80 min-w-56 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg"
                >
                  {group.links.map((link, i) => (
                    <Link
                      key={`${link.url}-${i}`}
                      to={link.url}
                      onClick={() => setOpen(null)}
                      className={cn(
                        "block rounded-sm px-3 py-2 text-sm hover:bg-primary/5",
                        pathname === link.url && "text-primary bg-primary/5"
                      )}
                    >
                      {t(link.name)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalNav;
