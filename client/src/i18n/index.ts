import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./resources";

/**
 * L4 · i18n 初始化
 *
 * 用 react-i18next + 2 种语言（en/ch），由自定义器的
 * isLanguage 状态调用 i18n.changeLanguage。翻译资源见 resources.ts。
 * keySeparator / nsSeparator 关闭，因为菜单原文含空格与点号，
 * 且未翻译项需要 t(key) 原样回退到英文。
 */
i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    Object.entries(translations).map(([lng, dict]) => [lng, { translation: dict }])
  ),
  lng: "en",
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
