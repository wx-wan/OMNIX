import { Module } from "@nestjs/common";
import { CrmModule } from "../crm/crm.module";
import { DesignOrderController } from "./design-order.controller";
import { DesignOrderService } from "./design-order.service";

@Module({
  imports: [CrmModule],
  controllers: [DesignOrderController],
  providers: [DesignOrderService],
})
export class DesignOrderModule {}
