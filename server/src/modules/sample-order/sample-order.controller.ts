import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { SampleOrderService } from "./sample-order.service";
import { CreateSampleOrderDto } from "./dto/create-sample-order.dto";
import { UpdateSampleOrderDto } from "./dto/update-sample-order.dto";

/**
 * 打样单 API（全局 session 守卫保护）。
 * - GET    /api/sample-orders?dealId=   列表（按商机过滤）
 * - POST   /api/sample-orders           新增（需关联已确认设计单）
 * - GET    /api/sample-orders/:id       详情
 * - PATCH  /api/sample-orders/:id       修改
 * - DELETE /api/sample-orders/:id       删除（软删）
 */
@Controller("sample-orders")
export class SampleOrderController {
  constructor(private readonly svc: SampleOrderService) {}

  @Get()
  list(@Query("dealId") dealId?: string) {
    return this.svc.list(dealId || undefined);
  }

  @Post()
  create(@Body() dto: CreateSampleOrderDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.create(dto, actorId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSampleOrderDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.update(id, dto, actorId);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.remove(id, actorId);
  }
}
