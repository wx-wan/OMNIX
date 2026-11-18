-- AlterTable
-- 操作列只记录所选预设 id，不触发创建或消息。
ALTER TABLE "tasks" ADD COLUMN "action" TEXT NOT NULL DEFAULT '';
ALTER TABLE "issues" ADD COLUMN "action" TEXT NOT NULL DEFAULT '';
