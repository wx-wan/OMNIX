import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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

  // GET /api/crm/deals/:id/chatter —— 取该商机的 Chatter 消息流（机器人操作历史 + 评论）
  @Get("deals/:id/chatter")
  getChatter(@Param("id") id: string) {
    return this.crm.listChatter(id);
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
}
