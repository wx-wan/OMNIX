-- 用户在线状态：后端状态机维护，SSE 向所有应用端广播
ALTER TABLE "contacts"
  ADD COLUMN "presence" TEXT NOT NULL DEFAULT 'offline',
  ADD COLUMN "last_active_at" TIMESTAMP(3);
