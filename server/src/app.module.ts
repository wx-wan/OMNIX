import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./modules/health/health.controller";
import { UsersModule } from "./modules/users/users.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
