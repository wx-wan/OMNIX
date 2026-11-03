import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Download, RefreshCw, ShieldAlert, Webhook, Bot } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useBotConfig, saveBotConfig } from "@/lib/botConfig";
import { RobotAvatar } from "@/components/common/RobotAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCIO_SKILL_FILENAME, ACCIO_SKILL_MD } from "@/lib/accioSkill";
import { Stack } from "@/components/layout/Stack";
import { PageMeta } from "@/components/layout/PageMeta";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface McpSettings {
  enabled: boolean;
  token: string | null;
  /** 后端检测到的本机局域网 IPv4（比浏览器 WebRTC 探测可靠）。 */
  lanIp?: string | null;
}

// wobnimo 内置 3D 形象（角色 id），供机器人个人偏好选择。
const BOT_CHARACTERS = [
  "mochi", "bao", "berry", "boo", "bumble", "cacti", "cap", "drift",
  "ember", "hop", "inky", "latte", "microduck", "miso", "pebble", "pip",
  "rex", "swirl", "tad", "volt",
];

export default function Settings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [token, setToken] = useState("");
  // 本机局域网 IP：优先后端返回（网卡直读，最可靠）；浏览器 WebRTC 探测仅作兜底。
  const [lanIp, setLanIp] = useState<string | null>(null);

  // /mcp 与 /api 同源（dev 经 Vite 代理、生产由后端同域托管），直接用当前站点源即可。
  const endpoint = `${window.location.origin}/mcp`;
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const load = () => {
    setLoading(true);
    api
      .get<McpSettings>("/settings/mcp")
      .then((r) => {
        setEnabled(r.data.enabled);
        setToken(r.data.token ?? "");
        if (r.data.lanIp) setLanIp(r.data.lanIp);
      })
      .catch(() => toast.error(t("settings.mcp.loadFailed")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebRTC 兜底探测：仅当后端尚未返回 lanIp 且以 localhost 访问时。
  // 若已用局域网 IP / 域名访问，则 endpoint 本身就是可用地址，无需此提示。
  useEffect(() => {
    if (!isLocalhost) return;
    let pc: RTCPeerConnection | null = null;
    let done = false;
    const finish = (ip: string | null) => {
      if (done) return;
      done = true;
      if (ip) setLanIp((prev) => prev ?? ip);
      pc?.close();
    };
    try {
      pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const m = /([0-9]{1,3}\.){3}[0-9]{1,3}/.exec(e.candidate.candidate);
        // 排除 mDNS 候选（形如 xxx.local，现代浏览器默认隐藏明文 IP）
        if (m && !m[0].startsWith("127.")) finish(m[0]);
      };
      pc.createOffer()
        .then((o) => pc!.setLocalDescription(o))
        .catch(() => finish(null));
      // 超时兜底：无法探测时给出手动查看指引
      setTimeout(() => finish(null), 2000);
    } catch {
      finish(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lanEndpoint =
    isLocalhost && lanIp
      ? `${window.location.protocol}//${lanIp}:${window.location.port || "80"}/mcp`
      : null;

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings/mcp", { enabled, token });
      toast.success(t("settings.mcp.saved"));
    } catch {
      toast.error(t("settings.mcp.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    try {
      const { data } = await api.post<{ token: string }>("/settings/mcp/regenerate");
      setToken(data.token);
      toast.success(t("settings.mcp.regenerated"));
    } catch {
      toast.error(t("settings.mcp.saveFailed"));
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(t("settings.mcp.copied")));
  };

  /** 把 Accio Work Skill 下载为 .md 文件，供一键导入。 */
  const downloadSkill = () => {
    const blob = new Blob([ACCIO_SKILL_MD], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ACCIO_SKILL_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("settings.mcp.skillDownloaded"));
  };

  /** 打开标准 OAuth 授权页（新标签页），走浏览器授权流程免手动复制令牌。 */
  const openBrowserAuth = () => {
    const redirectUri = encodeURIComponent(window.location.origin);
    const url = `${window.location.origin}/oauth/authorize?response_type=code&client_id=omnix-mcp&redirect_uri=${redirectUri}&scope=mcp&state=${encodeURIComponent("omnix-settings")}`;
    window.open(url, "_blank", "noopener");
  };

  // 机器人外观（个人偏好）：按当前登录用户存储，互不影响；改自己的不影响他人。
  const bot = useBotConfig();
  const [botName, setBotName] = useState("ominXBot");
  const [botChar, setBotChar] = useState("mochi");
  const [botSaving, setBotSaving] = useState(false);
  useEffect(() => {
    if (bot) {
      setBotName(bot.name);
      setBotChar(bot.botCharacter);
    }
  }, [bot]);
  const saveBot = async () => {
    if (botSaving) return;
    setBotSaving(true);
    try {
      await saveBotConfig({ name: botName.trim() || "ominXBot", botCharacter: botChar });
      toast.success(t("settings.bot.saved"));
    } catch {
      toast.error(t("settings.bot.saveFailed"));
    } finally {
      setBotSaving(false);
    }
  };

  const guide = [
    t("settings.mcp.guide1"),
    t("settings.mcp.guide2"),
    t("settings.mcp.guide3"),
    t("settings.mcp.guide4"),
  ];

  return (
    <Stack gap={6}>
      <PageMeta title={t("nav.settings")} />

      <Section title={t("appName")} description={t("settings.aboutDesc")}>
        <p className="text-sm text-muted-foreground">{t("settings.comingSoon")}</p>
      </Section>

      <Section
        title={t("settings.mcp.title")}
        description={t("settings.mcp.desc")}
        icon={Webhook}
        action={
          <Button onClick={save} disabled={loading || saving}>
            {t("settings.mcp.save")}
          </Button>
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label className="text-sm font-medium">{t("settings.mcp.enabled")}</Label>
                <p className="text-xs text-muted-foreground">{t("settings.mcp.enabledHint")}</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">{t("settings.mcp.endpoint")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.mcp.endpointHint")}</p>
              <div className="flex gap-2">
                <Input readOnly value={endpoint} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copy(endpoint)}
                  aria-label={t("settings.mcp.copy")}
                >
                  <Copy />
                </Button>
              </div>
            </div>

            {isLocalhost && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">{t("settings.mcp.lanAddress")}</Label>
                <p className="text-xs text-muted-foreground">{t("settings.mcp.lanAddressHint")}</p>
                {lanEndpoint ? (
                  <div className="flex gap-2">
                    <Input readOnly value={lanEndpoint} className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copy(lanEndpoint)}
                      aria-label={t("settings.mcp.copy")}
                    >
                      <Copy />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">{t("settings.mcp.lanAddressUnknown")}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">{t("settings.mcp.token")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.mcp.tokenHint")}</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={token}
                  placeholder={t("settings.mcp.tokenPlaceholder")}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => token && copy(token)}
                  disabled={!token}
                  aria-label={t("settings.mcp.copy")}
                >
                  <Copy />
                </Button>
                <Button variant="outline" onClick={regenerate} disabled={saving}>
                  <RefreshCw />
                  {t("settings.mcp.generate")}
                </Button>
              </div>
              {!token && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <ShieldAlert className="size-3.5" />
                  {t("settings.mcp.unauthWarning")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">{t("settings.mcp.headers")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.mcp.headersHint")}</p>
              {token ? (
                <div className="flex gap-2">
                  <Textarea
                    readOnly
                    value={`Authorization: Bearer ${token}`}
                    className="min-h-[64px] font-mono text-xs"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(`Authorization: Bearer ${token}`)}
                    aria-label={t("settings.mcp.copy")}
                  >
                    <Copy />
                  </Button>
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <ShieldAlert className="size-3.5" />
                  {t("settings.mcp.headersNoToken")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Button variant="outline" className="w-fit" onClick={openBrowserAuth}>
                {t("settings.mcp.browserAuth")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("settings.mcp.browserAuthHint")}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">{t("settings.mcp.testTitle")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.mcp.testHint")}</p>
              <Textarea
                readOnly
                value={t("settings.mcp.testPrompt")}
                className="min-h-[100px] font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => copy(t("settings.mcp.testPrompt"))}
              >
                <Copy />
                {t("settings.mcp.testCopy")}
              </Button>
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-sm font-medium">{t("settings.mcp.skillTitle")}</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copy(ACCIO_SKILL_MD)}>
                    <Copy />
                    {t("settings.mcp.skillCopy")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadSkill}>
                    <Download />
                    {t("settings.mcp.skillDownload")}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.mcp.skillHint")}</p>
              <Textarea
                readOnly
                value={ACCIO_SKILL_MD}
                className="max-h-72 min-h-[160px] font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">{t("settings.mcp.guideTitle")}</Label>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {guide.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Section>

      <Section
        title={t("settings.bot.title")}
        description={t("settings.bot.desc")}
        icon={Bot}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <RobotAvatar size={64} state="idle" character={botChar} />
            <div>
              <h3 className="text-sm font-semibold">{t("settings.bot.heading")}</h3>
              <p className="text-xs text-muted-foreground">{t("settings.bot.note")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t("settings.bot.name")}
              <Input
                className="w-40"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="ominXBot"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t("settings.bot.character")}
              <Select
                items={Object.fromEntries(BOT_CHARACTERS.map((c) => [c, c]))}
                value={botChar}
                onValueChange={(v) => setBotChar(String(v))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOT_CHARACTERS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button onClick={saveBot} disabled={botSaving || !bot}>
              {botSaving ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </div>
      </Section>
    </Stack>
  );
}
