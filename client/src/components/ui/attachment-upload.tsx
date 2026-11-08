import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "cn";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Attachment {
  /** 展示用文件名（服务端落盘后为 UUID 名，此处保留原始文件名）。 */
  name: string;
  /** 访问 URL（/uploads/...）。 */
  url: string;
}

export interface AttachmentUploadProps {
  value?: Attachment[] | null;
  onChange?: (value: Attachment[]) => void;
  /** 最多文件数，默认 10。 */
  maxCount?: number;
  /** 单个文件大小上限（MB），默认 20。 */
  maxSizeMB?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

const isImageName = (name: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);

const isAcceptedType = (f: File) =>
  f.type.startsWith("image/") || f.type === "application/pdf";

/**
 * 附件上传组件（多文件）：
 * - 点击 / 拖拽 / 粘贴截图 三种方式上传，走后端 /upload 落盘；
 * - 附件以文件行展示（图片显示缩略图），点击文件名新标签页打开；
 * - 纯受控组件：文件列表由 value/onChange 驱动。
 */
export function AttachmentUpload({
  value,
  onChange,
  maxCount = 10,
  maxSizeMB = 20,
  accept = "image/*,application/pdf",
  className,
  disabled = false,
}: AttachmentUploadProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Attachment[]>(value ?? []);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) setItems(value ?? []);
  }, [value]);

  const commit = (next: Attachment[]) => {
    setItems(next);
    onChange?.(next);
  };

  const upload = useCallback(
    async (files: FileList | File[] | null) => {
      if (disabled || uploading) return;
      const list = Array.from(files ?? []);
      if (!list.length) return;
      if (items.length + list.length > maxCount) {
        toast.error(t("attachment.maxCount", { count: maxCount }));
        return;
      }
      for (const f of list) {
        if (!isAcceptedType(f)) {
          toast.error(t("attachment.badType", { name: f.name }));
          return;
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
          toast.error(t("attachment.tooLarge", { name: f.name, size: maxSizeMB }));
          return;
        }
      }
      setUploading(true);
      try {
        const uploaded: Attachment[] = [];
        for (const f of list) {
          const fd = new FormData();
          fd.append("file", f);
          const r = await api.post("/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploaded.push({ name: f.name, url: r.data.url as string });
        }
        commit([...items, ...uploaded]);
      } catch {
        toast.error(t("attachment.uploadFailed"));
      } finally {
        setUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, maxCount, maxSizeMB, disabled, uploading, t],
  );

  // 支持直接粘贴剪贴板中的截图/文件
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files && files.length) {
        e.preventDefault();
        void upload(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [upload]);

  const remove = (url: string) => commit(items.filter((a) => a.url !== url));

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void upload(e.dataTransfer.files);
  };

  const openPicker = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          void upload(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-disabled={disabled || uploading}
        className={cn(
          "flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-primary/[0.04] to-transparent transition-colors hover:border-primary/60 hover:from-primary/[0.08] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          dragging && "border-primary bg-primary/10",
          (disabled || uploading) && "pointer-events-none opacity-60",
        )}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <UploadCloud className="size-4" />
        </span>
        <p className="px-3 text-center text-xs text-muted-foreground">
          {t("attachment.hint")}
        </p>
        <p className="text-center text-[11px] text-muted-foreground/70">
          {t("attachment.limits", { count: maxCount, size: maxSizeMB })}
        </p>
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {items.map((a) => (
            <li
              key={a.url}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
            >
              {isImageName(a.name) ? (
                <img
                  src={a.url}
                  alt={a.name}
                  className="size-8 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </span>
              )}
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-xs text-foreground hover:underline"
              >
                {a.name}
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(a.url)}
                  aria-label={t("attachment.remove")}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
      )}
    </div>
  );
}
