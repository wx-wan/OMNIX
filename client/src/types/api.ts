/**
 * D4 · 线上业务 API 统一响应信封
 *
 * 线上 demo 的 5 个业务端点（/api/notes、/api/ticket、/api/blog、
 * /api/email、/api/chat）都返回 { status, msg, data } 包装，data 为数组。
 * msg 大小写按线上原值（notes/ticket/email 为 'Success'，blog/chat 为 'success'）。
 */
export interface ApiEnvelope<T> {
  status: number;
  msg: string;
  data: T;
}

export interface ApiError {
  status: number;
  msg: string;
  data?: never;
}
