import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(@Query("limit") limit?: string) {
    return this.users.findAll(limit ? Number(limit) : undefined);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }
}
