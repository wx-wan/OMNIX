import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";

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
