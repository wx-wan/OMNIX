import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CrmModule } from "../crm/crm.module";
import { ProductsModule } from "../products/products.module";
import { EngineeringChangeService } from "./engineering-change.service";
import { EngineeringChangeController } from "./engineering-change.controller";

@Module({
  imports: [PrismaModule, CrmModule, ProductsModule],
  controllers: [EngineeringChangeController],
  providers: [EngineeringChangeService],
  exports: [EngineeringChangeService],
})
export class EngineeringChangeModule {}
