import { useState } from "react";
import {
  AlignLeft,
  AlignRight,
  Maximize2,
  Moon,
  PanelLeft,
  PanelTop,
  Pen,
  Settings,
  Square,
  Sun,
  X,
} from "lucide-react";
import { cn } from "src/lib/utils";
import { useCustomizer } from "../../context/CustomizerContext";
import { useTheme } from "../../context/shadcntheme/ThemeContext";

/**
 * C5 · 自定义器面板
 * 依据线上 demo（Next.js 商业版）Sheet 取证：右侧滑出、6 个分组，
 * 标题 "Customizer" / "Make changes to your customizer here."。
 * 线上没有 Reset / Share 按钮，故按 1:1 只实现这 6 组。
 */

const STYLE_ORDER: { key: string; label: string; shape: string }[] = [
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h4 className="text-base mb-2 font-semibold">{title}</h4>
      {children}
    </div>
  );
}

function OptionButton({
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

const Customizer = () => {
  const [open, setOpen] = useState(false);
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
    <>
      <button
        type="button"
        data-customizer-trigger
        aria-label="Open customizer"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 end-6 z-20 flex h-14 w-14 animate-spin items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/80"
      >
        <Settings className="size-5" />
      </button>

      {open && (
        <>
          <div
            className="cn-sheet-overlay fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-label="Customizer"
            data-customizer-panel
            className="cn-sheet-content fixed inset-y-0 end-0 z-50 w-sm max-w-full overflow-y-auto border-s border-border bg-background p-6 shadow-xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="cn-sheet-title text-lg font-semibold">Customizer</h3>
                <p className="cn-sheet-description text-sm text-muted-foreground">
                  Make changes to your customizer here.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close customizer"
                data-customizer-close
                onClick={() => setOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border cursor-pointer hover:bg-primary/5"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="pt-6">
              <Section title="Theme Style">
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
                      <span
                        className={cn(
                          "h-4 w-4 border border-current",
                          item.shape
                        )}
                      />
                      {item.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Theme Option">
                <div className="flex flex-wrap gap-4">
                  <OptionButton
                    active={!isDark}
                    onClick={() => setTheme("light")}
                    icon={<Sun className="size-4" />}
                  >
                    Light
                  </OptionButton>
                  <OptionButton
                    active={isDark}
                    onClick={() => setTheme("dark")}
                    icon={<Moon className="size-4" />}
                  >
                    Dark
                  </OptionButton>
                </div>
              </Section>

              <Section title="Theme Direction">
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

              <Section title="Choose Your Theme Colors">
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      { id: "primaryColorPicker", label: "Primary color", value: primary, onChange: onPrimary },
                      { id: "secondaryColorPicker", label: "Secondary color", value: secondary, onChange: onSecondary },
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

              <Section title="Layout Type">
                <div className="flex flex-wrap gap-4">
                  <OptionButton
                    active={state.activeLayout === "vertical"}
                    onClick={() => set("activeLayout", "vertical")}
                    icon={<PanelLeft className="size-4" />}
                  >
                    Vertical
                  </OptionButton>
                  <OptionButton
                    active={state.activeLayout === "horizontal"}
                    onClick={() => set("activeLayout", "horizontal")}
                    icon={<PanelTop className="size-4" />}
                  >
                    Horizontal
                  </OptionButton>
                </div>
              </Section>

              <Section title="Container Option">
                <div className="flex flex-wrap gap-4">
                  <OptionButton
                    active={state.isLayout === "boxed"}
                    onClick={() => set("isLayout", "boxed")}
                    icon={<Square className="size-4" />}
                  >
                    Boxed
                  </OptionButton>
                  <OptionButton
                    active={state.isLayout === "full"}
                    onClick={() => set("isLayout", "full")}
                    icon={<Maximize2 className="size-4" />}
                  >
                    Full
                  </OptionButton>
                </div>
              </Section>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Customizer;
