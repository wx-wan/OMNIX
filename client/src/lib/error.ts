// 从请求异常中提取可读的错误详情，供删除/保存等操作的错误提示复用。
export function extractErrorDetail(e: unknown): string {
  const err = e as {
    response?: {
      status?: number;
      data?: { message?: unknown; error?: string };
    };
    message?: string;
  };
  // 无 response：请求根本没到应用层（网络断开 / 后端未启动）
  if (!err?.response) {
    return err?.message || "网络异常，请稍后重试";
  }
  const status = err.response.status ?? 0;
  if (status === 401) return "登录已失效，请重新登录后再试";
  if (status === 403) return "没有权限执行此操作";
  if (status >= 500) return "服务器内部错误，请稍后重试";
  const data = err.response.data;
  if (data) {
    const msg = data.message;
    if (Array.isArray(msg)) {
      return msg.filter(Boolean).map(String).join("；");
    }
    if (typeof msg === "string" && msg) return msg;
    if (typeof data.error === "string" && data.error) return data.error;
  }
  return "操作失败，请稍后重试";
}
