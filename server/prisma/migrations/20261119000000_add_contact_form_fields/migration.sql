-- AlterTable
-- 联系人表单：公司常用信息 + 联系人信息所需字段（复用已有 name/website/country/email/phone/position/avatarUrl）。
ALTER TABLE "contacts"
  ADD COLUMN "source" TEXT,
  ADD COLUMN "landline" TEXT,
  ADD COLUMN "nickname" TEXT,
  ADD COLUMN "social_platform" TEXT,
  ADD COLUMN "social_account" TEXT,
  ADD COLUMN "mobile" TEXT,
  ADD COLUMN "job_rank" TEXT,
  ADD COLUMN "birthday" TIMESTAMP(3),
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "contact_notes" TEXT;
