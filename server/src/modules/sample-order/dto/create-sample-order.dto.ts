import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from "class-validator";

/** 打样单类型（11 种）。 */
export const SAMPLE_TYPES = [
  "新品开发样",
  "新品产前确认样",
  "老品产前确认样",
  "模种样",
  "3D手工上色样",
  "实验室测试样",
  "参展样",
  "大货样",
  "工厂内测样",
  "包装样",
  "组合样",
];

/** 打样单状态机。 */
export const SAMPLE_STATUSES = [
  "pending",
  "sampling",
  "shipped",
  "confirmed",
  "rejected",
];

export class CreateSampleOrderDto {
  /** 归属商机。 */
  @IsString()
  dealId!: string;

  /** 关联已确认设计单（业务必填）。 */
  @IsString()
  @IsNotEmpty()
  designOrderId!: string;

  /** 落库产品（可继承设计单的产品，也可另选）。 */
  @IsOptional()
  @IsString()
  productId?: string;

  /** 打样类型（11 种之一）。 */
  @IsString()
  @IsIn(SAMPLE_TYPES)
  sampleType!: string;

  /** 协助负责人：供应商职位「跟单」。 */
  @IsOptional()
  @IsString()
  assistantId?: string;

  /** 状态（默认 pending）。 */
  @IsOptional()
  @IsIn(SAMPLE_STATUSES)
  status?: string;

  /** 色号要求。 */
  @IsOptional()
  @IsString()
  colorCode?: string;

  /** 样品数量（默认 1）。 */
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  /** 样品工艺。 */
  @IsOptional()
  @IsString()
  craft?: string;

  /** 材质。 */
  @IsOptional()
  @IsString()
  material?: string;

  /** 硬度。 */
  @IsOptional()
  @IsString()
  hardness?: string;

  /** 产品尺寸-长。 */
  @IsOptional()
  @IsNumber()
  length?: number;

  /** 产品尺寸-宽。 */
  @IsOptional()
  @IsNumber()
  width?: number;

  /** 产品尺寸-高。 */
  @IsOptional()
  @IsNumber()
  height?: number;

  /** 要求完成时间（ISO 日期）。 */
  @IsOptional()
  @IsString()
  requiredCompletion?: string;

  /** 下单日期（默认创建日期）。 */
  @IsOptional()
  @IsString()
  orderDate?: string;

  /** 功能要求。 */
  @IsOptional()
  @IsString()
  functionalReq?: string;

  /** 包装图 [{name,url}]。 */
  @IsOptional()
  packagingImage?: unknown;

  /** 底部刻字图 [{name,url}]。 */
  @IsOptional()
  engravingImage?: unknown;

  /** 其他附件 [{name,url}]。 */
  @IsOptional()
  otherAttachments?: unknown;

  /** 验收标准。 */
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  /** 包装尺寸-长。 */
  @IsOptional()
  @IsNumber()
  packagingLength?: number;

  /** 包装尺寸-宽。 */
  @IsOptional()
  @IsNumber()
  packagingWidth?: number;

  /** 包装尺寸-高。 */
  @IsOptional()
  @IsNumber()
  packagingHeight?: number;

  /** 样品照片 [{name,url}]。 */
  @IsOptional()
  sampleFiles?: unknown;

  /** 快递单号。 */
  @IsOptional()
  @IsString()
  trackingNo?: string;

  /** 收件信息。 */
  @IsOptional()
  @IsString()
  recipient?: string;

  /** 创建人。 */
  @IsOptional()
  @IsString()
  createdBy?: string;
}
