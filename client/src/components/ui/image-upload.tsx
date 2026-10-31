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
    <div className={cn("relative group", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {src ? (
        <>
          <Image src={src} alt={t("image.preview")} ratio={ratio} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="pointer-events-auto"
              aria-label={t("image.preview")}
              onClick={() => setPreviewOpen(true)}
            >
              <Eye />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="pointer-events-auto"
              aria-label={t("image.modify")}
              onClick={openPicker}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="pointer-events-auto"
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
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-ring hover:bg-muted",
            dragging && "border-ring bg-muted",
            ratio ? "aspect-[var(--img-ratio)]" : "h-40",
          )}
        >
          <UploadCloud className="size-7" />
          <span className="text-sm">{t("image.dragHint")}</span>
        </button>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("image.previewTitle")}</DialogTitle>
          </DialogHeader>
          {src && (
            <img
              src={src}
              alt={t("image.preview")}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
