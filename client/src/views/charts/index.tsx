import { CHART_CARDS } from "src/components/charts";

/**
 * D2 · 图表组件验证载体
 *
 * 线上 demo 站内没有独立图表路由（Charts 分组 7 个链接全是外链），
 * 这个页面是契约外的组件层验证入口，供 V 阶段成套页面复用 wrappers。
 */
const ChartsPage = () => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {CHART_CARDS.map((ChartCard, index) => (
      <ChartCard key={index} />
    ))}
  </div>
);

export default ChartsPage;
