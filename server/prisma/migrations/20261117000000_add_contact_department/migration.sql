-- 部门字段：设置-成员页「部门」列展示（与 contacts.customerType 的业务部门语义区分）
ALTER TABLE "contacts"
  ADD COLUMN "department" TEXT;
