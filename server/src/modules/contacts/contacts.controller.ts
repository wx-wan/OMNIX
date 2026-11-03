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
} from "@nestjs/common";
import { Request } from "express";
import { ContactType } from "@prisma/client";
import { ContactsService } from "./contacts.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

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
  ) {
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

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateContactDto) {
    return this.svc.create(dto);
  }

  @Patch("bot")
  updateBot(@Req() req: Request, @Body() dto: UpdateContactDto) {
    return this.svc.updateBotForUser((req.session as { userId?: string }).userId!, dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }
}
