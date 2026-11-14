import { useState } from "react";
import {
  AlertCircle,
  File,
  Inbox,
  Info,
  Plus,
  Reply,
  Forward,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AppShell, AttachmentChip, avatarSrc } from "../shared";
import type { EmailType } from "src/types/apps/email";
import emailFixture from "src/api/mocks/fixtures/email.json";

/**
 * V2 · /apps/email 逐项 1:1
 *
 * 取证：线上三栏 = 240px 文件夹栏 / 340px 邮件列表 / 剩余阅读窗格；
 * 标题卡 "Email App" + "Home / Email App"；列表为 inbox:true 的 8 条，
 * from / label / subject / 相对时间与线上 DOM 逐项一致。
 */
const mails = (emailFixture as unknown as EmailType[]).filter((m) => m.inbox);
const NOW = Date.parse("2026-11-13T19:12:09.014Z");

function relTime(iso: string): string {
  const hours = (NOW - Date.parse(iso)) / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} mins ago`;
  if (hours < 24) return `${Math.floor(hours)} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const labelTone: Record<string, string> = {
  Promotional: "bg-muted text-muted-foreground",
  Social: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
  Health: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const folders = [
  { label: "Inbox", icon: Inbox, active: true },
  { label: "Sent", icon: Send },
  { label: "Draft", icon: File },
  { label: "Spam", icon: AlertCircle },
  { label: "Trash", icon: Trash2 },
];

const sorts = [
  { label: "Starred", icon: Star },
  { label: "Important", icon: Info },
];

const labels = [
  { label: "Promotional", tone: "bg-amber-400" },
  { label: "Social", tone: "bg-red-400" },
  { label: "Health", tone: "bg-sky-400" },
];

function Badge({ label }: { label: string }) {
  return (
    <span data-slot="badge" className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${labelTone[label] ?? labelTone.Promotional}`}>
      {label}
    </span>
  );
}

const EmailApp = () => {
  const [active, setActive] = useState(0);
  const mail = mails[active] ?? mails[0];
  const attachments = (mail.attchments ?? []) as { title: string; fileSize: string }[];

  return (
    <AppShell title="Email App">
      <Card className="gap-0" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="flex h-[calc(100vh-222px)] min-h-[600px]">
          {/* 240px 文件夹栏 */}
          <aside className="hidden w-full max-w-60 border-e p-0 sm:max-w-60 lg:block">
            <div className="p-4">
              <Button className="w-full" size="sm">
                <Plus className="me-1 h-4 w-4" /> Compose
              </Button>
            </div>
            <nav className="flex flex-col gap-1 px-3">
              {folders.map(({ label, icon: Icon, active: isActive }) => (
                <button
                  key={label}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </nav>
            <div className="mt-4 border-t px-6 pt-4">
              <p className="text-xs font-semibold tracking-wide">SORT BY</p>
              <div className="mt-2 flex flex-col gap-1">
                {sorts.map(({ label, icon: Icon }) => (
                  <button key={label} className="flex items-center gap-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t px-6 pt-4">
              <p className="text-xs font-semibold tracking-wide">LABELS</p>
              <div className="mt-2 flex flex-col gap-2">
                {labels.map(({ label, tone }) => (
                  <button key={label} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
                    <span className={`h-3 w-3 rounded-sm border ${tone}`} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 340px 邮件列表 */}
          <div className="left-part flex max-w-full flex-col border-e border-border lg:max-w-[340px]">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search Mail..." className="ps-9" />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {mails.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActive(i)}
                  className={`w-full border-b px-4 py-3 text-start transition-colors ${
                    i === active ? "bg-muted/70" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={false} aria-label={`Select mail ${i + 1}`} />
                    <span className="truncate text-sm font-semibold">{m.from}</span>
                    <span className="ms-auto"><Badge label={m.label} /></span>
                  </div>
                  <p className="mt-1 truncate ps-6 text-xs font-medium">{m.subject}</p>
                  <div className="mt-1 flex items-center gap-2 ps-6">
                    <Star className={`h-3.5 w-3.5 ${m.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="ms-auto text-[11px] text-muted-foreground">{relTime(m.time)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 阅读窗格 */}
          <div className="flex min-w-0 grow flex-col overflow-y-auto">
            <div className="flex items-center gap-4 border-b px-6 py-3">
              <Star className={`h-4 w-4 ${mail.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              <Info className="h-4 w-4 text-muted-foreground" />
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 px-6 pt-5">
              <img src={avatarSrc(mail.thumbnail)} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold">{mail.from}</p>
                <p className="text-xs text-muted-foreground">{mail.To}</p>
              </div>
              <span className="ms-auto"><Badge label={mail.label} /></span>
            </div>
            <h3 className="px-6 pt-5 text-lg font-semibold">{mail.subject}</h3>
            <div
              className="space-y-3 px-6 py-4 text-sm leading-relaxed text-muted-foreground [&_b]:text-foreground [&_p]:my-2"
              dangerouslySetInnerHTML={{ __html: mail.emailContent }}
            />
            {attachments.length > 0 && (
              <div className="border-t px-6 py-4">
                <p className="mb-3 text-sm font-semibold">Attachments</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {attachments.map((a) => (
                    <AttachmentChip key={a.title} name={a.title} size={a.fileSize} />
                  ))}
                </div>
              </div>
            )}
            <div className="mt-auto flex gap-2 border-t px-6 py-4">
              <Button variant="outline" size="sm"><Reply className="me-1 h-4 w-4" /> Reply</Button>
              <Button variant="outline" size="sm"><Forward className="me-1 h-4 w-4" /> Forward</Button>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
};

export default EmailApp;
