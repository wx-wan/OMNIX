import { Module } from "@nestjs/common";
import { CrmModule } from "../crm/crm.module";
import { QuotationsController } from "./quotations.controller";
import { QuotationsService } from "./quotations.service";

@Module({
  imports: [CrmModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
