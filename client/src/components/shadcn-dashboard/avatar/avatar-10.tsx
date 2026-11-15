"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authApi } from "@/api/auth";

const MAX_SIZE_MB = 2;

/** 移除头像后恢复的系统默认头像（本地静态资源，非外链）。 */
const DEFAULT_AVATAR = "/images/profile/user-1.png";

type AvatarDemoProps = {
  currentAvatarUrl?: string;
  initials?: string;
  onSaved?: (url: string) => void;
};

const AvatarDemo = ({
  currentAvatarUrl,
  initials = "JD",
  onSaved,
}: AvatarDemoProps) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  // Release the blob URL when it is replaced or the component unmounts.
  const setObjectUrl = (url: string | null) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = url;
  };

  useEffect(() => () => setObjectUrl(null), []);
  useEffect(() => {
    setPreview(currentAvatarUrl ?? null);
  }, [currentAvatarUrl]);

  /** 上传到后端落盘，再把相对路径写进用户资料（DB 存路径，不存外链）。 */
  async function persistAvatar(url: string | null) {
    setSaving(true);
    try {
      const next = await authApi.updateProfile({
        avatarUrl: url ?? DEFAULT_AVATAR,
      });
      setObjectUrl(null);
      setPreview(next.avatarUrl);
      onSaved?.(next.avatarUrl);
      setError(null);
      toast.success(t("Avatar updated"));
    } catch (cause) {
      setError((cause as Error).message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("Choose an image file."));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t("Image must be under {{n}} MB.", { n: MAX_SIZE_MB }));
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setObjectUrl(localUrl);
    setPreview(localUrl);
    setError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!response.ok) throw new Error(t("Upload failed"));
      const { url } = (await response.json()) as { url: string };
      setSaving(false);
      await persistAvatar(url);
    } catch (cause) {
      setObjectUrl(null);
      setPreview(currentAvatarUrl ?? null);
      setSaving(false);
      setError((cause as Error).message || t("Upload failed"));
    }
  };

  const remove = () => {
    void persistAvatar(null);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={t("Change profile photo")}
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar className="size-20">
            {preview && <AvatarImage src={preview} alt="Profile photo" />}
            <AvatarFallback className="bg-blue-500/15 text-xl font-medium text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-950/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
            <Camera className="size-5" aria-hidden="true" />
          </span>
        </button>

        <div className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{t("Profile photo")}</p>
            <p className="text-xs text-muted-foreground">
              {t("PNG, JPG or GIF, up to {{n}} MB.", { n: MAX_SIZE_MB })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => inputRef.current?.click()}
            >
              <Upload />
              {saving ? t("Saving...") : t("Upload")}
            </Button>
            {preview && (
              <Button size="sm" variant="ghost" disabled={saving} onClick={remove}>
                <Trash2 />
                {t("Remove")}
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFile}
      />
    </div>
  );
};

export default AvatarDemo;
