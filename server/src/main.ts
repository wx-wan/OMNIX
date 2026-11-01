import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import express from "express";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { AppModule } from "./app.module";
import { UPLOAD_DIR } from "./modules/upload/upload.controller";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 会话：登录态以 httpOnly cookie 存储（同源反代下随 /api 自动携带）
  // session 落 Postgres（connect-pg-simple）：后端重启不再导致全员掉线
  const PgSession = connectPgSimple(session);
  app.use(
    session({
      store: new PgSession({
        conString:
          process.env.DATABASE_URL ??
          "postgresql://stra@localhost:5432/omnix_dev?schema=public",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "omnix-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  // 全局开启 DTO 校验（配合 class-validator）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 允许前端（Vite 5173 同源反代，无需 CORS；这里为本地联调放宽）
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 静态托管上传目录：/uploads/xxx 可直接访问（图片由上传接口落盘，DB 仅存相对 URL）
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use("/uploads", express.static(UPLOAD_DIR));

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`🚀 OMNIX server listening on http://localhost:${port}`);
  console.log(`   Routes: /health · /auth · /users · /dashboard  (前端以 /api 同源反代)`);
}

bootstrap();
