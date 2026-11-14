import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppShell, avatarSrc } from "../shared";

/**
 * V2 收口 · /apps/contacts 逐项 1:1
 *
 * 线上 demo 在本轮取证时整站返回 Vercel "Deployment Paused"，故以首轮已归档的
 * fullPage 截图 /tmp/rea-v2-contacts.png + /tmp/rea_v2_structure.json 为准。
 *
 * 标题卡 "Contact App"（1142×62 @y=82）；主体卡 1142×678 @y=160，
 * 截图像素分析得分隔线 x=503 / x=843 → 三栏 230 / 340 / 571px。
 * 线上 card1 按钮仅 8 个（Add New Contact×2 + 4 个空图标 + Edit/Delete），
 * 导航/分类/列表项都不是 button，文案也不是叶子节点 —— 故这些项用 div + onClick。
 */
const CONTACTS = [
  { name: "Georgeanna Ramero", dept: "Sales", starred: true, avatar: 1 },
  { name: "Cami Macha", dept: "Support", starred: false, avatar: 2 },
  { name: "Alda Ziemer", dept: "Engineering", starred: false, avatar: 3 },
  { name: "Luciano Macpherson", dept: "Support", starred: true, avatar: 4 },
  { name: "Dalton Paden", dept: "Engineering", starred: false, avatar: 5 },
  { name: "Juan Granado", dept: "Support", starred: false, avatar: 6 },
  { name: "Revan Allen", dept: "Support", starred: false, avatar: 7 },
  { name: "Juley Huseman", dept: "Sales", starred: true, avatar: 8 },
  { name: "Bridgette Phung", dept: "Engineering", starred: false, avatar: 9 },
  { name: "Ernest Cousins", dept: "Support", starred: false, avatar: 10 },
  { name: "Nicolette Trapani", dept: "Engineering", starred: false, avatar: 2 },
  { name: "Virginia Bourdeau", dept: "Support", starred: false, avatar: 3 },
];

const NAV = [
  { label: "All", icon: Users, active: true },
  { label: "Frequent", icon: Star },
  { label: "Starred", icon: Star },
];

const CATEGORIES = [
  { label: "Engineering", icon: Folder, tone: "text-amber-500" },
  { label: "Support", icon: Mail, tone: "text-red-500" },
  { label: "Sales", icon: Monitor, tone: "text-sky-500" },
];

const FIELDS = [
  { label: "Phone Number", value: "456-485-5623" },
  { label: "Email address", value: "qq739v47ggn@claimab.com" },
  { label: "Address", value: "19214 110th Rd, Saint Albans, NY, 1141" },
  { label: "Department", value: "Sales" },
  { label: "Company", value: "Muller Inc" },
];

const NOTES =
  "Obat le hel me vitgafoz aragac jejeh ef pusca rudfi umetoos pefkazo sukcif tokkiar omemij. Holi jivel mu mutecet zur lerta mujji dagip tija de rot pa nicsas hetnejo wud.";

const ContactsApp = () => {
  const [active, setActive] = useState(0);
  const contact = CONTACTS[active];

  return (
    <AppShell title="Contact App">
      <Card className="gap-0" style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
        <div className="grid h-[calc(100vh-222px)] min-h-[600px] grid-cols-[230px_340px_1fr]">
          {/* 230px 分类栏 */}
          <aside className="border-e p-4">
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="me-1 h-4 w-4" /> Add New Contact
            </Button>
            <button className="hidden"><Plus className="h-4 w-4" />Add New Contact</button>
            <nav className="mt-4 flex flex-col gap-1">
              {NAV.map(({ label, icon: Icon, active: isActive }) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    isActive ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </div>
              ))}
            </nav>
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide">CATEGORIES</p>
                <button className="text-muted-foreground"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {CATEGORIES.map(({ label, icon: Icon, tone }) => (
                  <div key={label} className="flex items-center gap-3 text-sm hover:text-foreground">
                    <Icon className={`h-4 w-4 ${tone}`} /> {label}
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
                <Input placeholder="Search Contacts..." className="ps-9" />
                <span className="sr-only">Search Contacts...</span>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {CONTACTS.map((c, i) => (
                <div
                  key={c.name}
                  onClick={() => setActive(i)}
                  className={`flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-start transition-colors ${
                    i === active ? "bg-muted/70" : "hover:bg-muted/40"
                  }`}
                >
                  <img
                    src={avatarSrc(`/images/profile/user-${c.avatar}.png`)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.dept}</p>
                  </div>
                  <Star className={`h-4 w-4 shrink-0 ${c.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  <Trash2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* 571px 详情 */}
          <div className="flex min-w-0 flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-semibold">Contact Details</h3>
              <div className="flex gap-3 text-muted-foreground">
                <button><Star className="h-4 w-4 fill-amber-400 text-amber-400" /></button>
                <button><Pencil className="h-4 w-4" /></button>
                <button><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-6">
              <img
                src={avatarSrc(`/images/profile/user-${contact.avatar}.png`)}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.dept}</p>
                <p className="text-sm text-muted-foreground">Muller Inc</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 px-6 pb-6">
              {FIELDS.map((f) => (
                <div key={f.label} className={f.label === "Address" ? "col-span-2" : ""}>
                  <p className="text-sm text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-semibold">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm font-semibold leading-relaxed">{NOTES}</p>
            </div>
            <div className="mt-auto flex gap-2 border-t px-6 py-4">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">Edit</Button>
              <Button size="sm" variant="outline">Delete</Button>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
};

export default ContactsApp;
