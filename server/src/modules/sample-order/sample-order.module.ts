import { Module } from "@nestjs/common";
import { CrmModule } from "../crm/crm.module";
import { SampleOrderController } from "./sample-order.controller";
import { SampleOrderService } from "./sample-order.service";

@Module({
  imports: [CrmModule],
  controllers: [SampleOrderController],
  providers: [SampleOrderService],
})
export class SampleOrderModule {}
