import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CrmModule } from "../crm/crm.module";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";

@Module({
  imports: [PrismaModule, CrmModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
