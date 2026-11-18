-- AlterTable
-- 事项类型：output 输出 | prompt 提示 | input 输入。
ALTER TABLE "tasks" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'output';
ALTER TABLE "issues" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'output';
