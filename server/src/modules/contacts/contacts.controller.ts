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
  BadRequestException,
} from "@nestjs/common";
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
    @Query("companyId") companyId?: string,
  ) {
    return this.svc.list(
      type,
      limit ? Number(limit) : undefined,
      false,
      companyId,
    );
  }

  /** 系统机器人配置（前端选择 3D 形象）。静态路由必须声明在 :id 之前。 */
  @Get("bot")
  getBot() {
    return this.svc.getBot();
  }

  /** 某公司主联系人（isPrimary）。 */
  @Get("primary")
  getPrimary(@Query("companyId") companyId?: string) {
    if (!companyId) throw new BadRequestException("companyId 必填");
    return this.svc.getPrimary(companyId);
  }

  /** 将某联系人设为其公司主联系人。 */
  @Patch(":id/primary")
  setPrimary(@Param("id") id: string) {
    return this.svc.setPrimary(id);
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
  updateBot(@Body() dto: UpdateContactDto) {
    return this.svc.updateBot(dto);
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
