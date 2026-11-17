/**
 * 当前用户 = Alice Johnson：使用后端 /api/auth/users 中 alice@pms.com 的真实 CUID。
 * 早期 MSW 示例数据用 u1/u2 假 id，切真实用户后必须换成 CUID，否则负责人/成员
 * 无法与真实账号匹配，列表会显示「未指派 / ?」。
 *
 * 单独成文件，避免 use-workspace 与项目制 store 互相 import 形成循环依赖。
 */
export const CURRENT_USER_ID = "cmwhzff3k000cpttzjn6rhh4i";
