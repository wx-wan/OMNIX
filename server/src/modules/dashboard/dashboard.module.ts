import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
