import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { ContactType } from "@prisma/client";
import { MemberGuard } from "../auth/member.guard";
import { ContactsService } from "./contacts.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { UpdateContactUiMetaDto } from "./dto/update-contact-ui-meta.dto";

@Controller("contacts")
export class ContactsController {
  constructor(private readonly svc: ContactsService) {}

  @Get()
  list(
    @Query("type") type?: ContactType,
    @Query("limit") limit?: string,
    @Query("isCompany") isCompany?: string,
    @Query("parentId") parentId?: string,
    @Query("q") q?: string,
    @Query("includeArchived") includeArchived?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    // 传了 page → 分页模式：返回 { items, total, page, pageSize }（前端虚拟滚动 + 无限加载用）
    if (page !== undefined || pageSize !== undefined) {
      const p = page ? Math.max(1, Number(page) || 1) : 1;
      const ps = Math.min(200, Math.max(1, pageSize ? Number(pageSize) || 30 : 30));
      return this.svc.listPaginated(
        p,
        ps,
        type,
        isCompany === undefined ? undefined : isCompany === "true",
        parentId,
        includeArchived === "true",
        q,
      );
    }
    // 无 page → 传统数组返回（公司 Picker / Dashboard 等旧调用方兼容）
    return this.svc.list(
      type,
      limit ? Number(limit) : undefined,
      includeArchived === "true",
      isCompany === undefined ? undefined : isCompany === "true",
      parentId,
      q,
    );
  }

  /** 系统机器人展示配置（按当前用户个性化）。静态路由必须声明在 :id 之前。 */
  @Get("bot")
  getBot(@Req() req: Request) {
    return this.svc.getBotForUser((req.session as { userId?: string }).userId!);
  }

  /** 联系人页展示元数据（starred / notes，存 Setting KV）。静态路由必须在 :id 之前。 */
  @Get("ui-meta")
  getUiMeta() {
    return this.svc.getUiMeta();
  }

  @Patch("ui-meta/:id")
  @UseGuards(MemberGuard)
  updateUiMeta(@Param("id") id: string, @Body() dto: UpdateContactUiMetaDto) {
    return this.svc.updateUiMeta(id, dto);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(MemberGuard)
  create(@Body() dto: CreateContactDto) {
    return this.svc.create(dto);
  }

  @Patch("bot")
  updateBot(@Req() req: Request, @Body() dto: UpdateContactDto) {
    return this.svc.updateBotForUser((req.session as { userId?: string }).userId!, dto);
  }

  @Patch(":id")
  @UseGuards(MemberGuard)
  update(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(MemberGuard)
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }
}
