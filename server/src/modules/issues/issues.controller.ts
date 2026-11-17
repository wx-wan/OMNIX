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
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { MemberGuard } from "../auth/member.guard";
import { IssuesService } from "./issues.service";
import { CreateIssueDto } from "./dto/create-issue.dto";
import { UpdateIssueDto } from "./dto/update-issue.dto";
import { BulkCompleteIssuesDto } from "./dto/bulk-complete-issues.dto";

@Controller("issues")
export class IssuesController {
  constructor(private readonly svc: IssuesService) {}

  @Get()
  list(@Query("projectId") projectId?: string, @Query("sprintId") sprintId?: string) {
    return this.svc.list(projectId, sprintId);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(MemberGuard)
  create(@Body() dto: CreateIssueDto, @Req() req: Request) {
    return this.svc.create(dto, req.session?.userId ?? null);
  }

  @Patch("bulk/complete")
  @UseGuards(MemberGuard)
  bulkComplete(@Body() dto: BulkCompleteIssuesDto) {
    return this.svc.bulkComplete(dto.ids);
  }

  @Patch(":id")
  @UseGuards(MemberGuard)
  update(@Param("id") id: string, @Body() dto: UpdateIssueDto) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(MemberGuard)
  async remove(@Param("id") id: string) {
    await this.svc.remove(id);
  }
}
