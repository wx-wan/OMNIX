import { Module } from "@nestjs/common";
import { CrmModule } from "../crm/crm.module";
import { FeesController } from "./fees.controller";
import { FeesService } from "./fees.service";

@Module({
  imports: [CrmModule],
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}
