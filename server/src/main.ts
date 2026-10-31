import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`🚀 OMNIX server listening on http://localhost:${port}`);
  console.log(`   Routes: /health · /users · /dashboard  (前端以 /api 同源反代)`);
}

bootstrap();
