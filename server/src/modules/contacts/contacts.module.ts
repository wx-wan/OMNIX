import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ContactsService } from "./contacts.service";
import { ContactsController } from "./contacts.controller";

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
