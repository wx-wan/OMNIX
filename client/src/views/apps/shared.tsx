import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import u1 from "src/assets/images/profile/user-1.png";
import u2 from "src/assets/images/profile/user-2.png";
import u3 from "src/assets/images/profile/user-3.png";
import u4 from "src/assets/images/profile/user-4.png";
import u5 from "src/assets/images/profile/user-5.png";
import u6 from "src/assets/images/profile/user-6.png";
import u7 from "src/assets/images/profile/user-7.png";
import u8 from "src/assets/images/profile/user-8.png";
import u9 from "src/assets/images/profile/user-9.png";
import u10 from "src/assets/images/profile/user-10.png";
import fallback from "src/assets/images/profile/avtar.webp";
import adobe from "src/assets/images/chat/icon-adobe.svg";
import chrome from "src/assets/images/chat/icon-chrome.svg";
import figma from "src/assets/images/chat/icon-figma.svg";
import zip from "src/assets/images/chat/icon-zip-folder.svg";
import javascript from "src/assets/images/chat/icon-javascript.svg";

/**
 * V2 · apps 群 1 共用件
 *
 * 线上 fixture 里的头像路径是 /images/profile/user-N.png（Next public 路径），
 * 本地同名资源在 src/assets/images/profile/，这里做 1:1 路径映射。
 */
const AVATARS: Record<string, string> = {
  "user-1": u1, "user-2": u2, "user-3": u3, "user-4": u4, "user-5": u5,
  "user-6": u6, "user-7": u7, "user-8": u8, "user-9": u9, "user-10": u10,
};

export function avatarSrc(path?: string): string {
  const key = path?.split("/").pop()?.replace(/\.\w+$/, "");
  return (key && AVATARS[key]) || fallback;
}

/** 线上页面外层容器链（取证自 DOM：w-full mx-auto container → min-h → page-transition → flex flex-col gap-4） */
export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full mx-auto container">
      <div className="min-h-[calc(100vh-140px)]">
        <div className="page-transition">
          <div className="flex flex-col gap-4">
            <Card className="flex-row items-center justify-between px-6">
              <h2 className="text-lg font-semibold">{title}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Home</span>
                <span>/</span>
                <span className="text-foreground">{title}</span>
              </div>
            </Card>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 附件产品图标：本地 src/assets/images/chat/ 有与线上 /images/chat/ 完全同名的 SVG */
const FILE_ICONS: { match: RegExp; src: string }[] = [
  { match: /\.pdf$/i, src: adobe },
  { match: /\.html?$/i, src: chrome },
  { match: /\.fig$/i, src: figma },
  { match: /\.zip$/i, src: zip },
  { match: /\.js$/i, src: javascript },
];

export function FileIcon({ name }: { name: string }) {
  const hit = FILE_ICONS.find((f) => f.match.test(name));
  return hit ? (
    <img src={hit.src} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
  ) : (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold">F</span>
  );
}

export function AttachmentChip({ name, size }: { name: string; size: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-2">
      <FileIcon name={name} />
      <span className="min-w-0 truncate text-xs">{name}</span>
      <span className="ms-auto text-xs text-muted-foreground">{size}</span>
    </div>
  );
}
