import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { MemberGuard } from "../auth/member.guard";

@Module({
  imports: [PrismaModule],
  controllers: [TasksController],
  providers: [TasksService, MemberGuard],
  exports: [TasksService],
})
export class TasksModule {}
