import { Link } from "react-router";
import omnixLogo from "src/assets/images/logos/omnix-logo.png";
import omnixLogoDark from "src/assets/images/logos/omnix-logo-dark.png";
import omnixIcon from "src/assets/images/logos/omnix-icon.png";

/**
 * 品牌方提供 logo（2026-11-15）：蓝紫渐变无限符号 + Omnix 字标，黑底原图已抠成透明。
 * 展开态按主题切亮/暗两版；折叠态只显示图形 mark。
 */
const FullLogo = () => {
  return (
    <Link to={'/'} aria-label="Omnix" className="block shrink-0">
      <img
        src={omnixLogo}
        alt="Omnix"
        className="block h-6 w-auto dark:hidden group-data-[state=collapsed]:hidden"
      />
      <img
        src={omnixLogoDark}
        alt="Omnix"
        className="hidden h-6 w-auto dark:block group-data-[state=collapsed]:hidden"
      />
      <img
        src={omnixIcon}
        alt="Omnix"
        className="hidden size-7 shrink-0 object-contain group-data-[state=collapsed]:block"
      />
    </Link>
  );
};

export default FullLogo;
