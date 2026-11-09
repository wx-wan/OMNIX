import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { ProductCategoryService } from "./product-category.service";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./dto/category.dto";

@Controller("product-categories")
export class ProductCategoryController {
  constructor(private readonly svc: ProductCategoryService) {}

  @Get()
  listTree() {
    return this.svc.listTree();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.svc.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }
}
