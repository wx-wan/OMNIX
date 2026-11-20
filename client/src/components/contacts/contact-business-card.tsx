"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { httpAdapter, type UploadItem } from "@uploadcn/core";
import { useDropzone, useUpload } from "@uploadcn/react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { Eye, FileText, ImagePlus, Loader2, RotateCcw, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 名片一侧的文件信息：文件 ID / 原图 / 缩略图 / 原始文件名。 */
export type BusinessCardFile = {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
};

export type ContactBusinessCardValue = {
  front: BusinessCardFile | null;
  back: BusinessCardFile | null;
};

type Side = keyof ContactBusinessCardValue;

type UploadResult = {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
};

type Props = {
  value: ContactBusinessCardValue;
  onChange: (value: ContactBusinessCardValue) => void;
  disabled?: boolean;
  className?: string;
};

const ACCEPT = "image/*";
const MAX_SIZE = 20 * 1024 * 1024;

const EMPTY: ContactBusinessCardValue = { front: null, back: null };

const sideLabelKey = (side: Side) =>
  side === "front" ? "Business card front" : "Business card back";

function CardSide({
  side,
  file,
  onFile,
  onView,
  onRequestRemove,
  disabled,
}: {
  side: Side;
  file: BusinessCardFile | null;
  onFile: (file: BusinessCardFile) => void;
  onView: () => void;
  onRequestRemove: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const adapter = useMemo(
    () =>
      httpAdapter<UploadResult>({
        url: "/api/upload",
        withCredentials: true,
        parseResponse: (response) => {
          const data = JSON.parse(response.body) as {
            id?: string;
            url: string;
            thumbnailUrl?: string;
            filename?: string;
          };
          return {
            id: data.id ?? data.url,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl ?? data.url,
            filename: data.filename ?? data.url.split("/").pop() ?? data.url,
          };
        },
      }),
    [],
  );

  const { items, add, retry } = useUpload<UploadResult>({
    adapter,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    autoUpload: true,
    onSuccess: (item: UploadItem<UploadResult>) => {
      if (item.result) onFile(item.result);
    },
  });

  const addFiles = useCallback(
    (files: File[]) => {
      const next = files[0];
      if (next) void add([next]);
    },
    [add],
  );

  const { handlers, isDragging, isDragReject } = useDropzone({
    onDrop: addFiles,
    accept: ACCEPT,
    multiple: false,
    disabled,
  });

  const active = items.find((item) =>
    ["uploading", "queued", "validating", "processing", "scanning"].includes(item.status),
  );
  const failed = items.find((item) => item.status === "error" || item.status === "rejected");
  const isPdf = file?.url.toLowerCase().endsWith(".pdf") ?? false;

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        {...handlers}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={t(sideLabelKey(side))}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        className={cn(
          "group relative flex aspect-[1.586/1] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/20 transition-colors",
          "hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          isDragging && "border-foreground/40 bg-muted/40",
          isDragReject && "border-destructive",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {file ? (
          isPdf ? (
            <span className="flex flex-col items-center gap-1 text-muted-foreground">
              <FileText className="size-8" />
              <span className="max-w-[90%] truncate text-xs">{file.filename}</span>
            </span>
          ) : (
            <img
              src={file.thumbnailUrl || file.url}
              alt={t(sideLabelKey(side))}
              className="size-full object-cover"
            />
          )
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="size-6" />
            <span className="text-sm">{t(sideLabelKey(side))}</span>
          </span>
        )}

        {file && !disabled ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-linear-to-t from-background/90 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              aria-label={t("View")}
              onClick={(event) => { event.stopPropagation(); onView(); }}
            >
              <Eye />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              aria-label={t("Replace")}
              onClick={(event) => { event.stopPropagation(); openPicker(); }}
            >
              <RotateCcw />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              aria-label={t("Remove")}
              onClick={(event) => { event.stopPropagation(); onRequestRemove(); }}
            >
              <Trash2 />
            </Button>
          </div>
        ) : null}

        {active ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </span>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          tabIndex={-1}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {failed ? (
        <div className="flex items-center justify-between gap-2 text-xs text-destructive">
          <span className="truncate">{t("Upload failed")}</span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="shrink-0"
            onClick={() => void retry(failed.id)}
          >
            {t("Retry")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** 联系人名片：正反面上传、预览、替换、移除与高清全屏查看。与联系人表单解耦。 */
export function ContactBusinessCard({ value, onChange, disabled = false, className }: Props) {
  const { t } = useTranslation();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [removeSide, setRemoveSide] = useState<Side | null>(null);

  const setSide = useCallback(
    (side: Side, file: BusinessCardFile | null) =>
      onChange({ ...(value ?? EMPTY), [side]: file }),
    [onChange, value],
  );

  const sides: Side[] = ["front", "back"];
  const slides = sides
    .map((side) => value?.[side])
    .filter((item): item is BusinessCardFile => Boolean(item))
    .map((item) => ({ src: item.url, alt: item.filename }));

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      {sides.map((side) => (
        <CardSide
          key={side}
          side={side}
          file={value?.[side] ?? null}
          onFile={(file) => setSide(side, file)}
          onView={() => {
            const index = sides.filter((s) => value?.[s]).indexOf(side);
            setLightboxIndex(index < 0 ? 0 : index);
          }}
          onRequestRemove={() => setRemoveSide(side)}
          disabled={disabled}
        />
      ))}

      <Lightbox
        open={lightboxIndex !== null}
        close={() => setLightboxIndex(null)}
        index={lightboxIndex ?? 0}
        slides={slides}
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 4 }}
        controller={{ closeOnBackdropClick: true }}
      />

      <AlertDialog open={removeSide !== null} onOpenChange={(open) => !open && setRemoveSide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Remove")}</AlertDialogTitle>
            <AlertDialogDescription>{t("Remove business card?")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeSide) setSide(removeSide, null);
                setRemoveSide(null);
              }}
            >
              {t("Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ContactBusinessCard;
