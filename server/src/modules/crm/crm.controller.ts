import { Controller, Get, Patch, Param, Body } from "@nestjs/common";
import { CrmService } from "./crm.service";
import { UpdateDealDto } from "./dto/update-deal.dto";

@Controller("crm")
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  // GET /api/crm/board —— 看板全部数据（阶段 + 交易）
  @Get("board")
  getBoard() {
    return this.crm.getBoard();
  }

  // PATCH /api/crm/deals/:id —— 更新交易（含拖拽换列 / 改阶段）
  @Patch("deals/:id")
  updateDeal(@Param("id") id: string, @Body() dto: UpdateDealDto) {
    return this.crm.updateDeal(id, dto);
  }
}
