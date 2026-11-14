import Divider from "./divider";
import { useIsLyra } from "./StyleAwareWrapper";

interface Props {
  wrapperClassName?: string;
}

/** 点阵分隔线是 lyra 的灰底方格装饰；线上 vega 不渲染该网格项。 */
const StyleDivider = ({ wrapperClassName }: Props) => {
  const isLyra = useIsLyra();
  if (!isLyra) return null;

  if (wrapperClassName) {
    return (
      <div className={wrapperClassName}>
        <Divider noContainer />
      </div>
    );
  }
  return <Divider noContainer />;
};

export default StyleDivider;
