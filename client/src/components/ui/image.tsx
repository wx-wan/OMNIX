import { useState, type ImgHTMLAttributes, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { ImageOff } from "lucide-react";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";

type ImageStatus = "loading" | "loaded" | "error";

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** CSS aspect-ratio，如 "16/9"、"1/1"；不传则按原图尺寸。 */
  ratio?: string;
}

/** 图片组件：加载时显示骨架，失败时显示占位（断图图标 + 文案）。圆角裁切，对齐 island 风格。 */
export function Image({ src, alt, ratio, className, ...props }: ImageProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ImageStatus>("loading");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted",
        ratio && "aspect-[var(--img-ratio)]",
        className,
      )}
      style={ratio ? ({ "--img-ratio": ratio } as CSSProperties) : undefined}
    >
      {status === "loading" && <Skeleton className="absolute inset-0 size-full" />}
      {status === "error" ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <ImageOff className="size-6" />
          <span className="text-xs">{t("image.broken")}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "size-full object-cover transition-opacity duration-300",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
          {...props}
        />
      )}
    </div>
  );
}
