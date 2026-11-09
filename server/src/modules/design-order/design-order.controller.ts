import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { DesignOrderService } from "./design-order.service";
import { CreateDesignOrderDto } from "./dto/create-design-order.dto";
import { UpdateDesignOrderDto } from "./dto/update-design-order.dto";

/**
 * 设计单 API（全局 session 守卫保护）。
 * - GET    /api/design-orders?dealId=   列表（按商机过滤）
 * - POST   /api/design-orders           新增
 * - GET    /api/design-orders/:id       详情
 * - PATCH  /api/design-orders/:id       修改
 * - DELETE /api/design-orders/:id       删除（软删）
 */
@Controller("design-orders")
export class DesignOrderController {
  constructor(private readonly svc: DesignOrderService) {}

  @Get()
  list(@Query("dealId") dealId?: string) {
    return this.svc.list(dealId || undefined);
  }

  @Post()
  create(@Body() dto: CreateDesignOrderDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.create(dto, actorId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDesignOrderDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.update(id, dto, actorId);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.remove(id, actorId);
  }
}
