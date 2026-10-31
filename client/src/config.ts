/**
 * 前端运行期配置（来自 Vite 环境变量，构建时注入）。
 * 默认关闭，避免误开；需要时在各环境 .env 设置 VITE_CRM_DRAG_ENABLED=true。
 */
export const CRM_DRAG_ENABLED =
  import.meta.env.VITE_CRM_DRAG_ENABLED === "true";
