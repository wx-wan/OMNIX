import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { FeesService } from "./fees.service";
import { CreateFeeDto } from "./dto/create-fee.dto";
import { UpdateFeeDto } from "./dto/update-fee.dto";

/**
 * 费用单 API（全局 session 守卫保护）。
 * 路由（前端经 /api 前缀调用）：
 * - GET    /api/fees?dealId=     列表（按商机过滤）
 * - POST   /api/fees             新增费用项
 * - GET    /api/fees/:id         详情
 * - PATCH  /api/fees/:id         修改费用项
 * - DELETE /api/fees/:id         删除费用项
 */
@Controller("fees")
export class FeesController {
  constructor(private readonly fees: FeesService) {}

  @Get()
  list(@Query("dealId") dealId?: string) {
    return this.fees.list(dealId || undefined);
  }

  @Post()
  create(@Body() dto: CreateFeeDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.fees.create(dto, actorId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.fees.getOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateFeeDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.fees.update(id, dto, actorId);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.fees.remove(id, actorId);
  }
}
