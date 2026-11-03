/**
 * 客户信息是否「已完善」：
 * 除官网(website)外，核心字段（姓名 name / 公司 company / 邮箱 email /
 * 电话 phone / 客户类型 customerType / 国家地区 country）全部有值即视为完善。
 *
 * 完善 == 已核实：保存时据此清除 aiGenerated 标记（MCP/Accio 自动生成、信息不保真
 * 的「待完善」徽标即消失），并持久化——下次加载不再依赖前端实时计算。
 */
export type ContactCore = {
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  customerType?: string | null;
  country?: string | null;
};

export function isContactComplete(c: ContactCore): boolean {
  const filled = (v: unknown): boolean =>
    typeof v === "string" && v.trim().length > 0;
  return [c.name, c.company, c.email, c.phone, c.customerType, c.country].every(
    filled,
  );
}
