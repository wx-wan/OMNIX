import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { QuotationsService } from "./quotations.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { UpdateQuotationDto } from "./dto/update-quotation.dto";
import { SendQuotationDto } from "./dto/send-quotation.dto";
import { MailService } from "../mail/mail.service";

/**
 * 报价单 API（全局 session 守卫保护）。
 * 路由（前端经 /api 前缀调用）：
 * - GET    /api/quotations?dealId=     列表（可按商机过滤）
 * - POST   /api/quotations             从商机生成报价单（同时推进商机到「报价」阶段）
 * - GET    /api/quotations/:id         详情
 * - PATCH  /api/quotations/:id         更新条款/地址/备注/明细
 */
@Controller("quotations")
export class QuotationsController {
  constructor(
    private readonly quotations: QuotationsService,
    private readonly mail: MailService,
  ) {}

  @Get()
  list(@Query("dealId") dealId?: string) {
    return this.quotations.list(dealId || undefined);
  }

  @Post()
  create(@Body() dto: CreateQuotationDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.quotations.createFromDeal(dto, actorId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.quotations.getOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateQuotationDto,
    @Req() req: Request,
  ) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.quotations.update(id, dto, actorId);
  }

  /** 发送报价单邮件（可附 Excel 附件，附件由前端生成 base64 传上）。 */
  @Post(":id/send")
  send(@Param("id") id: string, @Body() dto: SendQuotationDto) {
    return this.quotations.getOne(id).then(() =>
      this.mail.send({
        to: dto.to,
        subject: dto.subject,
        html: dto.body.replace(/\n/g, "<br>"),
        text: dto.body,
        attachment: dto.attachmentBase64
          ? { filename: dto.attachmentName || "quotation.xlsx", base64: dto.attachmentBase64 }
          : null,
      }),
    );
  }
}
