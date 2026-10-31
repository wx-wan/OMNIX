import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";

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
}
