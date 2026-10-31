import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthGuard } from "./modules/auth/auth.guard";
import { HealthController } from "./modules/health/health.controller";
import { UsersModule } from "./modules/users/users.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { CrmModule } from "./modules/crm/crm.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { ProductsModule } from "./modules/products/products.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    CrmModule,
    CustomersModule,
    ProductsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
