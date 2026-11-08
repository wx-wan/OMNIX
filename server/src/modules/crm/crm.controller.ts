import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { CrmService } from "./crm.service";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { CreateDealDto } from "./dto/create-deal.dto";

@Controller("crm")
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  // GET /api/crm/board —— 看板全部数据（阶段 + 交易）
  @Get("board")
  getBoard() {
    return this.crm.getBoard();
  }

  // POST /api/crm/deals —— 新建商机（默认进入第一个阶段：线索到达）
  @Post("deals")
  createDeal(@Body() dto: CreateDealDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.crm.createDeal(dto, actorId);
  }

  // GET /api/crm/deals/by-contact/:contactId/count?excludeDealId= —— 同一客户商机数（类似商机展示）
  @Get("deals/by-contact/:contactId/count")
  countDealsByContact(
    @Param("contactId") contactId: string,
    @Query("excludeDealId") excludeDealId?: string,
  ) {
    return this.crm
      .countDealsByContact(contactId, excludeDealId)
      .then((count) => ({ count }));
  }

  // GET /api/crm/deals/:id —— 商机详情（含客户/联系人/产品/阶段）
  @Get("deals/:id")
  getDeal(@Param("id") id: string) {
    return this.crm.getDeal(id);
  }

  // PATCH /api/crm/deals/:id —— 更新交易（含拖拽换列 / 改阶段）
  @Patch("deals/:id")
  updateDeal(@Param("id") id: string, @Body() dto: UpdateDealDto, @Req() req: Request) {
    const actorId = (req.session as { userId?: string } | undefined)?.userId;
    return this.crm.updateDeal(id, dto, actorId);
  }

  // DELETE /api/crm/deals/:id —— 删除商机（级联报价单/阶段日志，清理 Chatter）
  @Delete("deals/:id")
  deleteDeal(@Param("id") id: string) {
    return this.crm.deleteDeal(id);
  }

  // GET /api/crm/deals/:id/chatter —— 取该商机的 Chatter 消息流（机器人操作历史 + 评论）
  // 支持分页：?limit=30&before=<最旧已加载消息 createdAt>，用于瀑布流加载更早消息
  @Get("deals/:id/chatter")
  getChatter(
    @Param("id") id: string,
    @Query("limit") limit?: string,
    @Query("before") before?: string,
  ) {
    return this.crm.listChatter(id, {
      limit: limit ? Number(limit) : undefined,
      before,
    });
  }

  // POST /api/crm/deals/:id/chatter —— 人工发布一条评论
  @Post("deals/:id/chatter")
  addChatter(
    @Param("id") id: string,
    @Body() body: { text?: string },
    @Req() req: Request,
  ) {
    const text = (body.text ?? "").trim();
    if (!text) throw new BadRequestException("text required");
    const userId = (req.session as { userId?: string } | undefined)?.userId;
    return this.crm.addComment(id, text, userId);
  }

  // DELETE /api/crm/deals/:id/chatter/:msgId —— 撤回一条评论（仅本人、3 分钟内）
  @Delete("deals/:id/chatter/:msgId")
  deleteChatter(
    @Param("id") id: string,
    @Param("msgId") msgId: string,
    @Req() req: Request,
  ) {
    const userId = (req.session as { userId?: string } | undefined)?.userId;
    return this.crm.deleteChatter(id, msgId, userId);
  }

  // POST /api/crm/deals/:id/chatter/archive —— 以机器人身份同步存档一条带附件的消息
  // （如导出报价单 xlsx：客户端传 base64，服务端落盘 /uploads 并写入讨论区）
  @Post("deals/:id/chatter/archive")
  archiveChatterFile(
    @Param("id") id: string,
    @Body() body: { attachmentName?: string; attachmentData?: string },
  ) {
    const { attachmentName, attachmentData } = body ?? {};
    if (!attachmentName || !attachmentData) {
      throw new BadRequestException("attachmentName 与 attachmentData 必填");
    }
    return this.crm.postArchiveFile(id, attachmentName, attachmentData);
  }
}
