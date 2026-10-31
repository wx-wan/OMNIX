import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { ContactsModule } from "../contacts/contacts.module";

@Module({
  imports: [ContactsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
