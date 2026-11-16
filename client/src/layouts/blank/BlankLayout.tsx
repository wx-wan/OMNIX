import { useEffect } from "react";
import { Outlet } from "react-router";
import ScrollToTop from "src/components/shared/ScrollToTop";
import { STYLE_NAMES } from "src/context/CustomizerContext";

/**
 * 访客页外壳（登录 / 注册 / 忘记密码 / 错误页）。
 *
 * 7 套主题皮肤的规则位于 utilities 层，会覆盖 AuthCard 的 gap-8、px-6 等
 * 实例工具类；而线上登录页的取证结论是「utilities 优先」。因此进入 BlankLayout
 * 时把根节点上的 style-* 摘掉，离开后由 FullLayout 按当前 activeStyle 补回。
 */
const BlankLayout = () => {
  useEffect(() => {
    const root = document.documentElement;
    STYLE_NAMES.forEach((name) => root.classList.remove(`style-${name}`));
  }, []);

  return (
    <ScrollToTop>
      <Outlet />
    </ScrollToTop>
  );
};

export default BlankLayout;
