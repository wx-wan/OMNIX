import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud, Pencil, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ImageUploadProps {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** 自定义上传：返回最终 URL；不传则本地读取为 data URL。 */
  onUpload?: (file: File) => Promise<string>;
  ratio?: string;
  accept?: string;
  className?: string;
  /** 空态只显示上传图标、隐藏提示文案（用于表格内紧凑单元格） */
  hideHint?: boolean;
  /** 紧凑模式：缩小空态图标（用于表格窄单元格） */
  compact?: boolean;
}

/**
 * 图片上传组件：
 * - 空态为拖拽/点击上传区；
 * - 有图时，点击缩略图打开预览 Dialog；更换 / 删除 操作放在预览弹窗内执行
 *   （不在缩略图上悬浮工具条，避免窄单元格溢出）。
 */
export function ImageUpload({
  value,
  defaultValue = null,
  onChange,
  onUpload,
  ratio,
  accept = "image/*",
  className,
  hideHint = false,
  compact = false,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [src, setSrc] = useState<string | null>(value ?? defaultValue);
  const [dragging, setDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) setSrc(value);
  }, [value]);

  const apply = (url: string) => {
    setSrc(url);
    onChange?.(url);
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (onUpload) {
      const url = await onUpload(file);
      apply(url);
    } else {
      const reader = new FileReader();
      reader.onload = () => apply(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openPicker = () => inputRef.current?.click();

  const remove = () => {
    setSrc(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const frameStyle = ratio
    ? ({ "--img-ratio": ratio } as CSSProperties)
    : undefined;

  return (
    <div className={cn("group relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {src ? (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-label={t("image.preview")}
          className="block w-full cursor-pointer overflow-hidden rounded-xl"
        >
          <Image
            src={src}
            alt={t("image.preview")}
            ratio={ratio}
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={frameStyle}
          className={cn(
            "group/drop relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-primary/[0.05] to-transparent text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:from-primary/[0.09] hover:shadow-card focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring",
            dragging &&
              "scale-[1.01] border-primary bg-primary/10 shadow-card",
            ratio ? "aspect-[var(--img-ratio)]" : "h-44",
          )}
        >
          <span className={cn("flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-200 group-hover/drop:scale-110", compact && "size-8")}>
            <UploadCloud className="size-6" />
          </span>
          {!hideHint && (
            <span className="px-4 text-center text-sm font-medium text-foreground">
              {t("image.dragHint")}
            </span>
          )}
        </button>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("image.previewTitle")}</DialogTitle>
          </DialogHeader>
          {src && (
            <img
              src={src}
              alt={t("image.preview")}
              className="max-h-[70vh] w-full rounded-xl object-contain shadow-card"
            />
          )}
          {/* 操作：更换 / 删除 放在预览弹窗内执行 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPreviewOpen(false);
                openPicker();
              }}
            >
              <Pencil />
              {t("image.modify")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setPreviewOpen(false);
                remove();
              }}
            >
              <Trash2 />
              {t("image.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
