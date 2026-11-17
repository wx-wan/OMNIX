/**
 * 角色值 → i18n key：把下划线命名转成标题式，使 super_admin 命中已有的
 * "Super Admin"（超级管理员）词条，其余 admin/user/viewer 等与源语言一致。
 */
export const roleLabelKey = (role?: string | null) =>
  role ? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
