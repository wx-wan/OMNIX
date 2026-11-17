import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { IssuesService } from "./issues.service";
import { IssuesController } from "./issues.controller";
import { MemberGuard } from "../auth/member.guard";

@Module({
  imports: [PrismaModule],
  controllers: [IssuesController],
  providers: [IssuesService, MemberGuard],
  exports: [IssuesService],
})
export class IssuesModule {}
