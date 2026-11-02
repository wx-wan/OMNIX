import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthGuard } from "./modules/auth/auth.guard";
import { HealthController } from "./modules/health/health.controller";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { CrmModule } from "./modules/crm/crm.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { ProductsModule } from "./modules/products/products.module";
import { UploadModule } from "./modules/upload/upload.module";
import { McpModule } from "./modules/mcp/mcp.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { OauthModule } from "./modules/oauth/oauth.module";
import { QuotationsModule } from "./modules/quotations/quotations.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    CrmModule,
    ContactsModule,
    ProductsModule,
    UploadModule,
    McpModule,
    SettingsModule,
    OauthModule,
    QuotationsModule,
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
