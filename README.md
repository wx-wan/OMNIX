# OMNIX

全栈应用脚手架：**前端 React 19 + shadcn/ui（Base UI + Tailwind v4），后端 NestJS + Prisma + PostgreSQL**。

> 从零初始化的干净项目（不带任何历史污染），沿用既有技术栈规范。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 · TypeScript · Vite · Tailwind CSS v4 · Base UI（shadcn `base-nova` 风格）· React Router v7 · i18next · Zustand · Sonner |
| 后端 | NestJS · Prisma ORM · PostgreSQL · @nestjs/config |
| 工程 | npm workspaces（monorepo：`client/` + `server/`） |

## 目录结构

```
OMNIX/
├── client/      # React 19 前端（Vite + Tailwind v4 + Base UI / shadcn）
├── server/      # NestJS 后端 + Prisma + PostgreSQL
└── package.json # 根脚本（dev / build / install:all）
```

## 快速开始

```bash
# 1. 安装前后端依赖
npm run install:all

# 2. 配置后端环境变量（复制示例并填写）
cp server/.env.example server/.env
#   至少设置 DATABASE_URL=postgresql://stra@localhost:5432/omnix_dev

# 3. 初始化数据库（生成 Prisma Client + 建表）
cd server && npx prisma migrate dev --name init && cd ..

# 4. 同时启动前后端（前端 5173，后端 4000，已配置同源 /api 反代）
npm run dev
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:4000/api （前端以 `/api` 调用，Vite 反代到 4000）

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 同时启动前后端 |
| `npm run dev:client` | 仅前端 |
| `npm run dev:server` | 仅后端（watch） |
| `npm run build:client` | 构建前端 |
| `npm run build:server` | 构建后端 |

## 环境变量

后端见 `server/.env.example`：

- `DATABASE_URL` — PostgreSQL 连接串
- `PORT` — 后端端口（默认 4000）
- `NODE_ENV` — 运行环境
