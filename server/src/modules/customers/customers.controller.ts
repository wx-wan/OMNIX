import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Controller("customers")
export class CustomersController {
  constructor(private readonly svc: CustomersService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.svc.create(dto);
  }

  // 给某公司新增联系人
  @Post(":id/contacts")
  createContact(@Param("id") id: string, @Body() dto: CreateContactDto) {
    return this.svc.createContact(id, dto);
  }

  // 联系人编辑（顶层路由，避免与 :id 冲突）
  @Patch("contacts/:id")
  updateContact(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.svc.updateContact(id, dto);
  }

  @Delete("contacts/:id")
  deleteContact(@Param("id") id: string) {
    return this.svc.deleteContact(id);
  }
}
