import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { TransitionProductDto } from "./dto/transition-product.dto";
import { ReplaceBomDto } from "./dto/bom.dto";

@Controller("products")
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  list(
    @Query("includeArchived") includeArchived?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.svc.list(
      includeArchived === "true",
      page != null ? Number(page) : undefined,
      pageSize != null ? Number(pageSize) : undefined,
    );
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.svc.create(dto);
  }

  /** 更新产品基础字段 / 图纸等（不含状态流转与 BOM，见各自端点）。 */
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.svc.update(id, dto);
  }

  /** 生命周期状态流转（有限状态机）。 */
  @Patch(":id/status")
  transition(
    @Param("id") id: string,
    @Body() dto: TransitionProductDto,
    @Req() req: Request,
  ) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.transition(id, dto.status, actorId);
  }

  /** 基于当前版本升版，生成新版本（新记录，同 partNo，revision+1）。 */
  @Post(":id/revisions")
  createRevision(@Param("id") id: string, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.createRevision(id, actorId);
  }

  @Get(":id/revisions")
  getRevisions(@Param("id") id: string) {
    return this.svc.getRevisions(id);
  }

  @Get(":id/bom")
  getBom(@Param("id") id: string) {
    return this.svc.getBom(id);
  }

  /** 整体替换某产品的 BOM（父件 → 子件清单）。 */
  @Put(":id/bom")
  replaceBom(
    @Param("id") id: string,
    @Body() dto: ReplaceBomDto,
    @Req() req: Request,
  ) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.replaceBom(
      id,
      dto.items.map((i) => ({
        childProductId: i.childProductId,
        quantity: i.quantity,
        position: i.position,
        note: i.note,
      })),
      actorId,
    );
  }

  /** 反查：该产品被哪些产品（装配）使用。 */
  @Get(":id/where-used")
  getWhereUsed(@Param("id") id: string) {
    return this.svc.getWhereUsed(id);
  }

  /** 产品审计 / 讨论流（复用 Chatter，resModel=product）。 */
  @Get(":id/chatter")
  getChatter(
    @Param("id") id: string,
    @Query("limit") limit?: string,
    @Query("before") before?: string,
  ) {
    return this.svc.listChatter(id, {
      limit: limit ? Number(limit) : undefined,
      before,
    });
  }

  @Post(":id/chatter")
  addChatter(
    @Param("id") id: string,
    @Body() body: { text?: string },
    @Req() req: Request,
  ) {
    const text = (body.text ?? "").trim();
    if (!text) throw new Error("text required");
    const userId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.addChatter(id, text, userId);
  }

  @Delete(":id/chatter/:msgId")
  deleteChatter(
    @Param("id") id: string,
    @Param("msgId") msgId: string,
    @Req() req: Request,
  ) {
    const userId = (req.session as { userId?: string } | undefined)?.userId;
    return this.svc.deleteChatter(id, msgId, userId);
  }

  /** 归档 / 取消归档：关联了商机的产品不允许删除，改用归档隐藏。 */
  @Patch(":id/archive")
  archive(@Param("id") id: string, @Body() body: { archived: boolean }) {
    return this.svc.archive(id, body?.archived ?? true);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }
}
