/**
 * PMS 演示的当前用户 = Bob Smith (u2)。
 * 依据：i3「You were assigned to 'Fix responsive layout issues'」的 assigneeId=u2；
 * u2 同时属于 Product(t1) 与 Engineering(t3)，对应 PMS 团队页「2 you belong to」。
 *
 * 单独成文件，避免 use-workspace 与项目制 store 互相 import 形成循环依赖。
 */
export const CURRENT_USER_ID = "u2";
