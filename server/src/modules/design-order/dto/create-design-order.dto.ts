import { IsIn, IsNotEmpty, IsOptional, IsString, IsBoolean } from "class-validator";

/** 设计单产品类型（仅两种）。 */
export const DESIGN_PRODUCT_TYPES = ["新品3D开发（设计）", "新品开发（设计）"];

/** 设计单状态机。 */
export const DESIGN_STATUSES = [
  "draft",
  "designing",
  "pending_review",
  "approved",
  "rejected",
];

export class CreateDesignOrderDto {
  /** 归属商机。 */
  @IsString()
  dealId!: string;

  /** 关联已有产品（设计单只允许关联已有产品，不允许新建）。 */
  @IsString()
  @IsNotEmpty()
  productId!: string;

  /** 完善的产品名称（同步回写 Product.name）。 */
  @IsString()
  @IsNotEmpty()
  productName!: string;

  /** 产品类型（新品3D开发（设计）/ 新品开发（设计））。 */
  @IsString()
  @IsIn(DESIGN_PRODUCT_TYPES)
  productType!: string;

  /** 协助负责人：系统用户（Contact.type=user）。 */
  @IsOptional()
  @IsString()
  assistantId?: string;

  /** 状态（默认 draft）。 */
  @IsOptional()
  @IsIn(DESIGN_STATUSES)
  status?: string;

  /** 产品主图 [{name,url}]。 */
  @IsOptional()
  mainImage?: unknown;

  /** 三视图+上色位 [{name,url}]。 */
  @IsOptional()
  threeViews?: unknown;

  /** 是否收取样品费。 */
  @IsOptional()
  @IsBoolean()
  sampleFee?: boolean;

  /** 交期（ISO 日期）。 */
  @IsOptional()
  @IsString()
  dueDate?: string;

  /** 创建人（前端可传，后端优先取登录用户）。 */
  @IsOptional()
  @IsString()
  createdBy?: string;
}
