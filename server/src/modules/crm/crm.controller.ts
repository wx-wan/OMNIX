import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
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
  createDeal(@Body() dto: CreateDealDto) {
    return this.crm.createDeal(dto);
  }

  // PATCH /api/crm/deals/:id —— 更新交易（含拖拽换列 / 改阶段）
  @Patch("deals/:id")
  updateDeal(@Param("id") id: string, @Body() dto: UpdateDealDto) {
    return this.crm.updateDeal(id, dto);
  }
}
