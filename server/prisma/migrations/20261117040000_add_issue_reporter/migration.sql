-- AlterTable
-- 创建人：存量问题无会话归属，保持 NULL；新建问题由后端按当前登录用户写入。
ALTER TABLE "issues" ADD COLUMN "reporter_id" TEXT;
