import { useMemo, useState } from "react";
import {
  Folder,
  Mail,
  Monitor,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "@/components/shadcn-dashboard/sonner/toast";
import Loading from "@/components/shadcn-dashboard/spinner/loading";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useContacts, type Contact, type ContactInput } from "@/api/contacts/use-contacts";
import { AppShell, avatarSrc } from "../shared";

/**
 * V2 收口 · /apps/contacts 逐项 1:1（UI 不动）
 *
 * 线上 demo 在本轮取证时整站返回 Vercel "Deployment Paused"，故以首轮已归档的
 * fullPage 截图 /tmp/rea-v2-contacts.png + /tmp/rea_v2_structure.json 为准。
 *
 * 标题卡 "Contact App"（1142×62 @y=82）；主体卡 1142×678 @y=160，
 * 截图像素分析得分隔线 x=503 / x=843 → 三栏 230 / 340 / 571px。
 * 线上 card1 按钮仅 8 个（Add New Contact×2 + 4 个空图标 + Edit/Delete），
 * 导航/分类/列表项都不是 button，文案也不是叶子节点 —— 故这些项用 div + onClick。
 *
 * 2026-11-15：数据改为后端 contacts 表（现有字段近似映射），starred/notes 存 Setting KV。
 * DOM / 类名 / 文案保持 1:1，仅接数据源与交互 handler。
 */
// value 是英文业务值（state 与后端字段比较用），显示文案走 t()。
const NAV = [
  { value: "All", icon: Users },
  { value: "Frequent", icon: Star },
  { value: "Starred", icon: Star },
];

const CATEGORIES = [
  { value: "Engineering", icon: Folder, tone: "text-amber-500" },
  { value: "Support", icon: Mail, tone: "text-red-500" },
  { value: "Sales", icon: Monitor, tone: "text-sky-500" },
];

// 联系人分类的中文语义与通用词条不同：供应商 / 客户 / 同事。
const DEPT_LABEL: Record<string, string> = {
  Engineering: "ContactEngineering",
  Support: "ContactSupport",
  Sales: "ContactSales",
};
const deptLabel = (t: (key: string) => string, value?: string | null) =>
  value ? t(DEPT_LABEL[value] ?? value) : "";

/** 新增/编辑沿用当前 UI，不引入弹窗：用浏览器 prompt 收集字段。 */
function promptContact(t: (key: string) => string, base?: Contact): ContactInput | null {
  const name = window.prompt(t("Name"), base?.name ?? "");
  if (!name?.trim()) return null;
  const phone = window.prompt(t("Phone Number"), base?.phone ?? "456-485-5623") ?? "";
  const email = window.prompt(t("Email address"), base?.email ?? "") ?? "";
  const dept =
    window.prompt(
      t("Department (Sales / Support / Engineering)"),
      deptLabel(t, base?.customerType) || deptLabel(t, "Sales"),
    ) ?? "Sales";
  const country = window.prompt(t("Address"), base?.country ?? "") ?? "";
  const company = window.prompt(t("Company"), base?.company ?? "Muller Inc") ?? "Muller Inc";
  const safeEmail = email.trim() || `${Date.now()}@claimab.com`;
  const matched = CATEGORIES.find((c) => c.value === dept || deptLabel(t, c.value) === dept);
  return {
    name: name.trim(),
    phone,
    email: safeEmail,
    customerType: matched?.value ?? "Sales",
    country,
    company,
    avatarUrl: base?.avatarUrl ?? "/images/profile/user-1.png",
  };
}

const ContactsApp = () => {
  const { t } = useTranslation();
  const { contacts, starred, notes, isLoading, error, create, update, remove, setStarred, setNotes } =
    useContacts();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [nav, setNav] = useState("All");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    let rows = contacts;
    if (nav === "Starred") rows = rows.filter((c) => starred[c.id]);
    // 后端没有 frequent 字段：以最近创建的 6 条近似「经常联系」。
    if (nav === "Frequent") rows = contacts.slice(0, 6);
    if (category) rows = rows.filter((c) => c.customerType === category);
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((c) =>
        [c.name, c.email, c.phone, c.company].some((v) => v?.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [contacts, starred, nav, category, query]);

  const active = visible.find((c) => c.id === activeId) ?? visible[0];
  const fields = [
    { key: "Phone Number", value: active?.phone ?? "" },
    { key: "Email address", value: active?.email ?? "" },
    { key: "Address", value: active?.country ?? "" },
    { key: "Department", value: deptLabel(t, active?.customerType) },
    { key: "Company", value: active?.company ?? "" },
  ];

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (e) {
      toast.error((e as Error).message || t("Operation failed"));
    }
  }

  function handleAdd() {
    const input = promptContact(t);
    if (input) void run(() => create(input), t("Contact created"));
  }

  function handleEdit() {
    if (!active) return;
    const input = promptContact(t, active);
    if (input) void run(() => update(active.id, input), t("Contact updated"));
  }

  function handleRemove(id?: string) {
    const target = contacts.find((c) => c.id === id) ?? active;
    if (!target || !window.confirm(t("Delete contact {{name}}?", { name: target.name }))) return;
    void run(async () => {
      await remove(target.id);
      if (active?.id === target.id) setActiveId(null);
    }, t("Contact deleted"));
  }

  function handleStar(id: string) {
    void run(
      () => setStarred(id, !starred[id]),
      starred[id] ? t("Removed from favorites") : t("Added to favorites"),
    );
  }

  function handleNotes() {
    if (!active) return;
    const next = window.prompt(t("Notes"), notes[active.id] ?? "");
    if (next !== null) void run(() => setNotes(active.id, next), t("Notes saved"));
  }

  return (
    <AppShell title={t("Contact App")}>
      <Card className="gap-0" style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
        <div className="grid h-[calc(100vh-222px)] min-h-[600px] grid-cols-[230px_340px_1fr]">
          {/* 230px 分类栏 */}
          <aside className="border-e p-4">
            <Button variant="outline" size="sm" className="w-full" onClick={handleAdd}>
              <Plus className="me-1 h-4 w-4" /> {t("Add New Contact")}
            </Button>
            <button className="hidden"><Plus className="h-4 w-4" />{t("Add New Contact")}</button>
            <nav className="mt-4 flex flex-col gap-1">
              {NAV.map(({ value, icon: Icon }) => (
                <div
                  key={value}
                  onClick={() => { setNav(value); setCategory(null); setActiveId(null); }}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    nav === value && !category ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {t(value)}
                </div>
              ))}
            </nav>
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide">{t("CATEGORIES")}</p>
                <button className="text-muted-foreground" onClick={handleAdd}><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {CATEGORIES.map(({ value, icon: Icon, tone }) => (
                  <div
                    key={value}
                    onClick={() => { setCategory(category === value ? null : value); setNav("All"); setActiveId(null); }}
                    className={`flex cursor-pointer items-center gap-3 text-sm ${category === value ? "font-medium text-foreground" : "hover:text-foreground"}`}
                  >
                    <Icon className={`h-4 w-4 ${tone}`} /> {deptLabel(t, value)}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* 340px 联系人列表 */}
          <div className="flex flex-col border-e">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("Search Contacts...")}
                  className="ps-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <span className="sr-only">{t("Search Contacts...")}</span>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading && <Loading className="min-h-24" />}
              {!isLoading && error && <p className="px-4 py-3 text-sm text-destructive">{t("Failed to load contacts")}</p>}
              {visible.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-start transition-colors ${
                    c.id === active?.id ? "bg-muted/70" : "hover:bg-muted/40"
                  }`}
                >
                  <img
                    src={avatarSrc(c.avatarUrl ?? "/images/profile/user-1.png")}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{deptLabel(t, c.customerType)}</p>
                  </div>
                  <Star
                    onClick={(event) => { event.stopPropagation(); handleStar(c.id); }}
                    className={`h-4 w-4 shrink-0 cursor-pointer ${starred[c.id] ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                  />
                  <Trash2
                    onClick={(event) => { event.stopPropagation(); handleRemove(c.id); }}
                    className="h-4 w-4 shrink-0 cursor-pointer text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 571px 详情 */}
          <div className="flex min-w-0 flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-semibold">{t("Contact Details")}</h3>
              <div className="flex gap-3 text-muted-foreground">
                <button onClick={() => active && handleStar(active.id)}>
                  <Star className={`h-4 w-4 ${starred[active?.id ?? ""] ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>
                <button onClick={handleEdit}><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleRemove()}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-6">
              <img
                src={avatarSrc(active?.avatarUrl ?? "/images/profile/user-1.png")}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold">{active?.name ?? ""}</p>
                <p className="text-sm text-muted-foreground">{deptLabel(t, active?.customerType)}</p>
                <p className="text-sm text-muted-foreground">{active?.company ?? ""}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-6 pb-6">
              {fields.map((f) => (
                <div key={f.key} className={f.key === "Address" ? "col-span-2" : ""}>
                  <p className="text-sm text-muted-foreground">{t(f.key)}</p>
                  <p className="text-sm font-semibold">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-muted-foreground">{t("Notes")}</p>
              <p className="cursor-pointer text-sm font-semibold leading-relaxed" onClick={handleNotes}>
                {notes[active?.id ?? ""] ?? ""}
              </p>
            </div>
            <div className="mt-auto flex gap-2 border-t px-6 py-4">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={handleEdit}>{t("Edit")}</Button>
              <Button size="sm" variant="outline" onClick={() => handleRemove()}>{t("Delete")}</Button>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
};

export default ContactsApp;
