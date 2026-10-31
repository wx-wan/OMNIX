import axios from "axios";

/**
 * 全站统一的 HTTP 客户端。
 * 所有业务请求走 /api 前缀，由 Vite dev server 同源反代到 NestJS 后端（:4000）。
 * 生产构建时 /api 由反向代理（nginx 等）转发，同样同源。
 */
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // 携带 session cookie（登录态）
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // 统一错误提示交给调用方 / sonner 处理；这里只规范化错误。
    return Promise.reject(error);
  },
);

export default api;
