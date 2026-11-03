/**
 * 客户信息是否「已完善」：
 * 除官网(website)外，核心字段全部有值即视为完善。公司与个人的判定口径不同——
 * 贴近 Odoo 范式（个人需关联所属公司 parentId，公司自身无需 parent）：
 *
 *  - 个人联系人(isCompany=false)：姓名 name / 所属公司(关联 parentId，兼容旧文本 company)
 *    / 邮箱 email / 电话 phone / 客户类型 customerType / 国家地区 country 全部有值 → 完善。
 *  - 公司(isCompany=true)：自身无需 parent，姓名 name / 邮箱 email / 电话 phone /
 *    客户类型 customerType / 国家地区 country 全部有值 → 完善。
 *
 * 完善 == 已核实：保存时据此清除 aiGenerated 标记（MCP/Accio 自动生成、信息不保真
 * 的「待完善」徽标即消失），并持久化——下次加载不再依赖前端实时计算。
 */
export type ContactCore = {
  isCompany?: boolean | null;
  name?: string | null;
  company?: string | null;
  parentId?: string | null;
  email?: string | null;
  phone?: string | null;
  customerType?: string | null;
  country?: string | null;
};

export function isContactComplete(c: ContactCore | null | undefined): boolean {
  const filled = (v: unknown): boolean =>
    typeof v === "string" && v.trim().length > 0;
  const name = filled(c?.name);
  const email = filled(c?.email);
  const phone = filled(c?.phone);
  const customerType = filled(c?.customerType);
  const country = filled(c?.country);

  if (c?.isCompany) {
    // 公司：自身无需关联 parent，其余核心字段齐全即完善
    return name && email && phone && customerType && country;
  }
  // 个人：额外要求已关联所属公司（parentId 优先，兼容尚未迁移的旧文本 company）
  const linkedCompany = filled(c?.parentId) || filled(c?.company);
  return name && linkedCompany && email && phone && customerType && country;
}
