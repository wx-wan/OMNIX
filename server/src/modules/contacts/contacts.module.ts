import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ContactsService } from "./contacts.service";
import { ContactsController } from "./contacts.controller";
import { MemberGuard } from "../auth/member.guard";

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController],
  providers: [ContactsService, MemberGuard],
  exports: [ContactsService],
})
export class ContactsModule {}
