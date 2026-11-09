import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { EngineeringChangeService } from "./engineering-change.service";
import { CreateEcoDto } from "./dto/eco.dto";

@Controller("engineering-changes")
export class EngineeringChangeController {
  constructor(private readonly svc: EngineeringChangeService) {}

  @Get()
  list(@Query("productId") productId?: string) {
    return this.svc.list(productId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateEcoDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.create({ ...dto, requestedById: actorId });
  }

  @Patch(":id/status")
  transition(
    @Param("id") id: string,
    @Body() body: { status: string },
    @Req() req: Request,
  ) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.transition(id, body.status, actorId);
  }

  @Post(":id/products")
  addProduct(
    @Param("id") id: string,
    @Body() body: { productId: string; note?: string },
  ) {
    return this.svc.addProduct(id, body.productId, body.note);
  }

  @Delete(":id/products/:productId")
  removeProduct(
    @Param("id") id: string,
    @Param("productId") productId: string,
  ) {
    return this.svc.removeProduct(id, productId);
  }

  @Post(":id/implement")
  implement(@Param("id") id: string, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.implement(id, actorId);
  }
}
