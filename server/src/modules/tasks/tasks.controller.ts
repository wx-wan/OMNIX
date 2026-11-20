import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { MemberGuard } from "../auth/member.guard";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { BulkCompleteTasksDto } from "./dto/bulk-complete-tasks.dto";

@Controller("tasks")
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Get()
  list(@Query("projectId") projectId?: string) {
    return this.svc.list(projectId);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(MemberGuard)
  create(@Body() dto: CreateTaskDto) {
    return this.svc.create(dto);
  }

  @Patch("bulk/complete")
  @UseGuards(MemberGuard)
  bulkComplete(@Body() dto: BulkCompleteTasksDto) {
    return this.svc.bulkComplete(dto.ids);
  }

  @Get(":id/contact")
  getContact(@Param("id") id: string) {
    return this.svc.getContactId(id);
  }

  @Patch(":id/contact")
  @UseGuards(MemberGuard)
  setContact(@Param("id") id: string, @Body() dto: { contactId: string | null }) {
    return this.svc.setContactId(id, dto.contactId);
  }

  @Patch(":id")
  @UseGuards(MemberGuard)
  update(@Param("id") id: string, @Body() dto: UpdateTaskDto) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(MemberGuard)
  async remove(@Param("id") id: string) {
    await this.svc.remove(id);
  }
}
