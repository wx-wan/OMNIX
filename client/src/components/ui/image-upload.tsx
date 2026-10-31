import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { UploadCloud, Eye, Pencil, Trash2 } from "lucide-react";
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
}

/** 图片上传组件：空态为拖拽/点击上传区；有图时悬停出现 预览 / 修改 / 删除 操作，预览走 Dialog 放大。 */
export function ImageUpload({
  value,
  defaultValue = null,
  onChange,
  onUpload,
  ratio,
  accept = "image/*",
  className,
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
        <>
          <Image
            src={src}
            alt={t("image.preview")}
            ratio={ratio}
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 rounded-b-xl bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="pointer-events-auto shadow-sm"
              aria-label={t("image.preview")}
              onClick={() => setPreviewOpen(true)}
            >
              <Eye />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="pointer-events-auto shadow-sm"
              aria-label={t("image.modify")}
              onClick={openPicker}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="pointer-events-auto shadow-sm"
              aria-label={t("image.delete")}
              onClick={remove}
            >
              <Trash2 />
            </Button>
          </div>
        </>
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
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-200 group-hover/drop:scale-110">
            <UploadCloud className="size-6" />
          </span>
          <span className="px-4 text-center text-sm font-medium text-foreground">
            {t("image.dragHint")}
          </span>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
