import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import i18n from "../i18n";
import { isSupportedLanguage, type LanguageCode } from "../i18n/resources";

/**
 * 商业版 CustomizerContext 的 14 项状态契约（线上 demo 的 ThemeInitializer 配置）。
 * C1 只负责状态、持久化与根属性同步；具体 UI 面板在 C5，主题色表在 C4，
 * mini-sidebar / horizontal 的 DOM 与 CSS 在 L1/L2，故此处不动 data-sidebar-type。
 */
export type CustomizerState = {
  activeDir: "ltr" | "rtl";
  activeTheme: string;
  activeStyle: string;
  activeLayout: "vertical" | "horizontal";
  isLayout: "boxed" | "full";
  isSidebarHover: boolean;
  isCollapse: boolean;
  isLanguage: LanguageCode;
  isCardShadow: boolean;
  isHorizontal: boolean;
  isBorderRadius: number;
  sidebarWidth: string;
  miniSidebarWidth: string;
};

export const DEFAULT_CUSTOMIZER: CustomizerState = {
  activeDir: "ltr",
  activeTheme: "CUSTOM_THEME",
  activeStyle: "vega",
  activeLayout: "vertical",
  isLayout: "boxed",
  isSidebarHover: false,
  isCollapse: false,
  isLanguage: "en",
  isCardShadow: false,
  isHorizontal: false,
  isBorderRadius: 12,
  sidebarWidth: "280px",
  miniSidebarWidth: "70px",
};

/** 键名与线上 demo 的 localStorage 保持一致，便于 REA 场景取证对齐。 */
const STORAGE_KEYS: Record<keyof CustomizerState, string> = {
  activeDir: "activeDir",
  activeTheme: "activeTheme",
  activeStyle: "activeStyle",
  activeLayout: "activeLayout",
  isLayout: "isLayout",
  isSidebarHover: "isSidebarHover",
  isCollapse: "isCollapse",
  isLanguage: "isLanguage",
  isCardShadow: "isCardShadow",
  isHorizontal: "isHorizontal",
  isBorderRadius: "isBorderRadius",
  sidebarWidth: "sidebarWidth",
  miniSidebarWidth: "miniSidebarWidth",
};

type CustomizerContextValue = {
  state: CustomizerState;
  set: <K extends keyof CustomizerState>(key: K, value: CustomizerState[K]) => void;
  reset: () => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
};

/** 线上 demo 的 7 套 style，C4 起由 activeStyle 驱动根 class。 */
export const STYLE_NAMES = ["luma", "lyra", "maia", "mira", "nova", "rhea", "vega"] as const;

/** 线上自定义器用 `<input type=color>` 动态注入 --primary / --secondary。 */
const COLOR_KEYS = { primary: "customPrimary", secondary: "customSecondary" } as const;

const CustomizerCtx = createContext<CustomizerContextValue | null>(null);

function readState(): CustomizerState {
  const next = { ...DEFAULT_CUSTOMIZER };
  if (typeof window === "undefined") return next;
  (Object.keys(STORAGE_KEYS) as (keyof CustomizerState)[]).forEach((key) => {
    const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
    if (raw === null || raw === "") return;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      // 线上允许存裸字符串；JSON 解析失败时按字符串处理
      value = raw;
    }
    if (typeof value !== typeof DEFAULT_CUSTOMIZER[key]) return;
    // 只认 en / ch：旧版本可能持久化过 fr / ar，清掉残留并回退到默认英文
    if (key === "isLanguage" && !isSupportedLanguage(value)) {
      window.localStorage.removeItem(STORAGE_KEYS[key]);
      return;
    }
    (next as Record<string, unknown>)[key] = value;
  });
  return next;
}

export function CustomizerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CustomizerState>(readState);

  const set = useCallback(
    <K extends keyof CustomizerState>(key: K, value: CustomizerState[K]) => {
      window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
      window.localStorage.setItem(
        STORAGE_KEYS[key] + "_default",
        JSON.stringify(DEFAULT_CUSTOMIZER[key])
      );
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    (Object.keys(STORAGE_KEYS) as (keyof CustomizerState)[]).forEach((key) => {
      window.localStorage.removeItem(STORAGE_KEYS[key]);
      window.localStorage.removeItem(STORAGE_KEYS[key] + "_default");
    });
    Object.values(COLOR_KEYS).forEach((key) => window.localStorage.removeItem(key));
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--secondary");
    setState({ ...DEFAULT_CUSTOMIZER });
  }, []);

  /** 对齐线上自定义器：把用户选的颜色写进 localStorage 并即时注入 CSS 变量。 */
  const applyColor = useCallback((kind: "primary" | "secondary", color: string) => {
    const key = COLOR_KEYS[kind];
    const root = document.documentElement;
    if (color) {
      window.localStorage.setItem(key, color);
      root.style.setProperty(`--${kind}`, color);
    } else {
      window.localStorage.removeItem(key);
      root.style.removeProperty(`--${kind}`);
    }
  }, []);

  const setPrimaryColor = useCallback((c: string) => applyColor("primary", c), [applyColor]);
  const setSecondaryColor = useCallback((c: string) => applyColor("secondary", c), [applyColor]);

  // L4：语言状态驱动 i18next，与 dir 相互独立（线上切语言不改阅读方向）
  useEffect(() => {
    void i18n.changeLanguage(state.isLanguage);
  }, [state.isLanguage]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", state.activeDir);
    root.setAttribute("data-color-theme", state.activeTheme);
    root.setAttribute("data-layout", state.activeLayout);
    root.setAttribute("data-boxed-layout", state.isLayout);
    root.setAttribute("data-card-shadow", String(state.isCardShadow));
    // L2：线上 data-sidebar-type = String(isCollapse)，仅 mini-sidebar 启用 hover 预览
    root.setAttribute("data-sidebar-type", String(state.isCollapse));

    // C4：activeStyle 驱动根 class，7 套皮肤即时切换。
    // ThemeProvider 只增删 light/dark，不会清掉 style-* class。
    STYLE_NAMES.forEach((name) => root.classList.remove(`style-${name}`));
    root.classList.add(`style-${state.activeStyle}`);

    // 恢复持久化的自定义主题色
    (Object.keys(COLOR_KEYS) as ("primary" | "secondary")[]).forEach((kind) => {
      const saved = window.localStorage.getItem(COLOR_KEYS[kind]);
      if (saved) root.style.setProperty(`--${kind}`, saved);
    });

    // 线上仅 nova 风格用 isBorderRadius 覆盖 --radius；其余交回 theme-tokens.css
    if (state.activeStyle === "nova") {
      root.style.setProperty("--radius", `${state.isBorderRadius / 16}rem`);
    } else {
      root.style.removeProperty("--radius");
    }
  }, [state]);

  const value = useMemo(
    () => ({ state, set, reset, setPrimaryColor, setSecondaryColor }),
    [state, set, reset, setPrimaryColor, setSecondaryColor]
  );
  return <CustomizerCtx.Provider value={value}>{children}</CustomizerCtx.Provider>;
}

export function useCustomizer() {
  const ctx = useContext(CustomizerCtx);
  if (!ctx) throw new Error("useCustomizer must be used within CustomizerProvider");
  return ctx;
}
