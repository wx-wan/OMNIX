import flagCn from "src/assets/images/flag/icon-flag-cn.svg";
import flagEn from "src/assets/images/flag/icon-flag-en.svg";
import { useCustomizer } from "../../context/CustomizerContext";
import { LANGUAGES } from "../../i18n/resources";

/**
 * 顶栏语言切换：单按钮直接在中 / 英之间切换，不做下拉菜单。
 * 图标用项目自带的 icon-flag-cn / icon-flag-en SVG（28x20），不再用 emoji 国旗。
 * 语言与 dir 是互相独立的状态：切语言不会改变阅读方向。
 */
const LanguageSwitcher = () => {
  const { state, set } = useCustomizer();
  const current = LANGUAGES.find((l) => l.value === state.isLanguage) ?? LANGUAGES[0];
  const isChinese = current.value === "ch";
  const next = isChinese ? "en" : "ch";

  return (
    <button
      type="button"
      data-language-trigger
      data-language-current={current.value}
      aria-label={isChinese ? "Switch to English" : "切换到中文"}
      title={current.label}
      onClick={() => set("isLanguage", next)}
      className="flex size-10 items-center justify-center rounded-full cursor-pointer hover:bg-primary/5"
    >
      <img src={isChinese ? flagCn : flagEn} alt="" className="h-5 w-7 rounded-sm" />
    </button>
  );
};

export default LanguageSwitcher;
