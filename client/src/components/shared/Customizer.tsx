import { useState } from "react";
import {
  AlignLeft,
  AlignRight,
  Maximize2,
  Moon,
  PanelLeft,
  PanelTop,
  Pen,
  Square,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "src/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomizer } from "../../context/CustomizerContext";
import { useTheme } from "../../context/shadcntheme/ThemeContext";

/**
 * 自定义器控件：原右下角 Sheet 的 6 个分组（Theme Style / Theme Option /
 * Theme Direction / Choose Your Theme Colors / Layout Type / Container Option）。
 *
 * 2026-11-15 按用户要求迁入 /settings/layout：去掉浮标与 Sheet 外壳，
 * 分组改用设置页既有 Card / CardHeader / CardTitle / CardContent 结构；
 * 控件本体（OptionButton、style 按钮、color picker）沿用线上取证件，
 * 状态仍全部走 CustomizerContext + ThemeContext，样式契约文件一律不变。
 */

export const STYLE_ORDER: { key: string; label: string; shape: string }[] = [
  { key: "vega", label: "Vega", shape: "rounded-[5px]" },
  { key: "nova", label: "Nova", shape: "rounded-[2px]" },
  { key: "maia", label: "Maia", shape: "rounded-full" },
  { key: "lyra", label: "Lyra", shape: "rounded-[3px]" },
  { key: "mira", label: "Mira", shape: "rotate-45 rounded-[2px]" },
  { key: "luma", label: "Luma", shape: "rounded-full" },
  { key: "rhea", label: "Rhea", shape: "h-2.5 w-5 rounded-full" },
];

const DEFAULT_PRIMARY = "#171717";
const DEFAULT_SECONDARY = "#f5f5f5";

/** 分组外壳：与原 Section 同名同语义，但按设置页规范用官方 Card 承载。 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OptionButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border px-5 py-6 text-sm cursor-pointer shadow-none transition-all hover:scale-105",
        active
          ? "text-primary bg-primary/5 border-primary/20 hover:bg-primary/20"
          : "border-border hover:text-primary"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export default function CustomizerControls() {
  const { t } = useTranslation();
  const { state, set, setPrimaryColor, setSecondaryColor } = useCustomizer();
  const { theme, setTheme } = useTheme();
  const [primary, setPrimary] = useState(
    () => localStorage.getItem("customPrimary") || DEFAULT_PRIMARY
  );
  const [secondary, setSecondary] = useState(
    () => localStorage.getItem("customSecondary") || DEFAULT_SECONDARY
  );

  const isDark = theme === "dark";

  const onPrimary = (color: string) => {
    setPrimary(color);
    setPrimaryColor(color);
  };
  const onSecondary = (color: string) => {
    setSecondary(color);
    setSecondaryColor(color);
  };

  return (
    <div className="space-y-4" data-settings-layout-controls>
      <Section title={t("Theme Style")}>
        <div className="grid grid-cols-4 gap-2">
          {STYLE_ORDER.map((item) => (
            <button
              key={item.key}
              type="button"
              data-style-option={item.key}
              aria-pressed={state.activeStyle === item.key}
              onClick={() => set("activeStyle", item.key)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1.5 rounded-md border text-xs cursor-pointer transition-all hover:scale-105",
                state.activeStyle === item.key
                  ? "text-primary bg-primary/5 border-primary/20"
                  : "border-border"
              )}
            >
              <span className={cn("h-4 w-4 border border-current", item.shape)} />
              {item.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("Theme Option")}>
        <div className="flex flex-wrap gap-4">
          <OptionButton
            active={!isDark}
            onClick={() => setTheme("light")}
            icon={<Sun className="size-4" />}
          >
            {t("Light")}
          </OptionButton>
          <OptionButton
            active={isDark}
            onClick={() => setTheme("dark")}
            icon={<Moon className="size-4" />}
          >
            {t("Dark")}
          </OptionButton>
        </div>
      </Section>

      <Section title={t("Theme Direction")}>
        <div className="flex flex-wrap gap-4">
          <OptionButton
            active={state.activeDir === "ltr"}
            onClick={() => set("activeDir", "ltr")}
            icon={<AlignLeft className="size-4" />}
          >
            LTR
          </OptionButton>
          <OptionButton
            active={state.activeDir === "rtl"}
            onClick={() => set("activeDir", "rtl")}
            icon={<AlignRight className="size-4" />}
          >
            RTL
          </OptionButton>
        </div>
      </Section>

      <Section title={t("Choose Your Theme Colors")}>
        <div className="flex flex-wrap gap-4">
          {(
            [
              {
                id: "primaryColorPicker",
                label: t("Primary color"),
                value: primary,
                onChange: onPrimary,
              },
              {
                id: "secondaryColorPicker",
                label: t("Secondary color"),
                value: secondary,
                onChange: onSecondary,
              },
            ] as const
          ).map((picker) => (
            <div
              key={picker.id}
              className="relative border border-border py-5 px-6 rounded-md cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: picker.value }}
                />
                <Pen className="size-4" />
              </div>
              <input
                type="color"
                id={picker.id}
                aria-label={picker.label}
                value={picker.value}
                onChange={(e) => picker.onChange(e.target.value)}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("Layout Type")}>
        <div className="flex flex-wrap gap-4">
          <OptionButton
            active={state.activeLayout === "vertical"}
            onClick={() => set("activeLayout", "vertical")}
            icon={<PanelLeft className="size-4" />}
          >
            {t("Vertical")}
          </OptionButton>
          <OptionButton
            active={state.activeLayout === "horizontal"}
            onClick={() => set("activeLayout", "horizontal")}
            icon={<PanelTop className="size-4" />}
          >
            {t("Horizontal")}
          </OptionButton>
        </div>
      </Section>

      <Section title={t("Container Option")}>
        <div className="flex flex-wrap gap-4">
          <OptionButton
            active={state.isLayout === "boxed"}
            onClick={() => set("isLayout", "boxed")}
            icon={<Square className="size-4" />}
          >
            {t("Boxed")}
          </OptionButton>
          <OptionButton
            active={state.isLayout === "full"}
            onClick={() => set("isLayout", "full")}
            icon={<Maximize2 className="size-4" />}
          >
            {t("Full")}
          </OptionButton>
        </div>
      </Section>
    </div>
  );
}
