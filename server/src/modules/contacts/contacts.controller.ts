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
  ) {
    return this.svc.list(
      type,
      limit ? Number(limit) : undefined,
    );
  }

  /** 系统机器人配置（前端选择 3D 形象）。静态路由必须声明在 :id 之前。 */
  @Get("bot")
  getBot() {
    return this.svc.getBot();
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
