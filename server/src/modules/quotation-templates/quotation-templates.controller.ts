import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { QuotationTemplatesService } from "./quotation-templates.service";
import { CreateQuotationTemplateDto } from "./dto/create-quotation-template.dto";
import { UpdateQuotationTemplateDto } from "./dto/update-quotation-template.dto";

/**
 * 报价单版式模板 API（全局 session 守卫保护）。
 * 路由（前端经 /api 前缀调用）：
 * - GET    /api/quotation-templates        列表
 * - GET    /api/quotation-templates/:id     详情
 * - POST   /api/quotation-templates        创建
 * - PATCH  /api/quotation-templates/:id     更新（名称 / 版式）
 * - DELETE /api/quotation-templates/:id     删除（同时把引用它的报价单 templateId 置空）
 */
@Controller("quotation-templates")
export class QuotationTemplatesController {
  constructor(private readonly svc: QuotationTemplatesService) {}

  @Get()
  list(@Query("docType") docType?: string) {
    return this.svc.list(docType);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateQuotationTemplateDto) {
    return this.svc.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateQuotationTemplateDto) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }
}
