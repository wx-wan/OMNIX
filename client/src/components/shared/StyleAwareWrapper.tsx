import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
  lyraClassName: string;
  defaultClassName?: string;
}

/**
 * Lyra 用 `p-px gap-px bg-border` 把网格缝隙做成 1px 边框线；
 * 其它风格（vega 等）的卡片是圆角 + 自带 1px 边框，若仍套灰底方格，
 * 圆角外就会露出灰色块。线上商业版按风格分流，这里补齐同样的判断。
 * 监听 html.class 以便后续自定义器切换 style 时同步生效。
 */
export function useIsLyra() {
  const [isLyra, setIsLyra] = useState(() =>
    typeof document === "undefined" ||
    document.documentElement.classList.contains("style-lyra")
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsLyra(root.classList.contains("style-lyra"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isLyra;
}

const StyleAwareWrapper = ({ children, lyraClassName, defaultClassName }: Props) => {
  const isLyra = useIsLyra();
  return (
    <div className={isLyra ? lyraClassName : (defaultClassName ?? lyraClassName)}>
      {children}
    </div>
  );
};

export default StyleAwareWrapper;
