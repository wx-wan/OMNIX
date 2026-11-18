-- AlterTable
-- 阶段日程：预估起止（人工填写）与实际完成时间（点击完成阶段时写入）分开存储。
ALTER TABLE "projects" ADD COLUMN "stage_schedule" JSONB;
