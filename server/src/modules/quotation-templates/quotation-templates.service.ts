import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateQuotationTemplateDto } from "./dto/create-quotation-template.dto";
import { UpdateQuotationTemplateDto } from "./dto/update-quotation-template.dto";

/**
 * 报价单版式模板 CRUD。模板与文档实例严格分离：
 * 本模块只读写 quotation_templates.layout，绝不被按单手改回写。
 */
@Injectable()
export class QuotationTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(docType?: string) {
    return this.prisma.quotationTemplate.findMany({
      where: docType ? { docType } : undefined,
      orderBy: { updatedAt: "desc" },
    });
  }

  async getOne(id: string) {
    const t = await this.prisma.quotationTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException(`QuotationTemplate ${id} not found`);
    return t;
  }

  create(dto: CreateQuotationTemplateDto) {
    return this.prisma.quotationTemplate.create({
      data: {
        name: dto.name,
        docType: dto.docType ?? "quotation",
        sheetSnapshot: dto.sheetSnapshot as never,
      },
    });
  }

  async update(id: string, dto: UpdateQuotationTemplateDto) {
    await this.getOne(id);
    return this.prisma.quotationTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.docType !== undefined ? { docType: dto.docType } : {}),
        ...(dto.sheetSnapshot !== undefined
          ? { sheetSnapshot: dto.sheetSnapshot as never }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.getOne(id);
    // 解除引用：把引用此模板的报价单 templateId 置空（回退到默认模板）
    await this.prisma.quotation.updateMany({
      where: { templateId: id },
      data: { templateId: null },
    });
    return this.prisma.quotationTemplate.delete({ where: { id } });
  }
}
