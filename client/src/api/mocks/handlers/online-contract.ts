import { http, HttpResponse } from "msw";
import type { ApiEnvelope } from "src/types/api";
import type { EmailType } from "src/types/apps/email";
import type { ChatType } from "src/types/apps/chat";
import notesFixture from "../fixtures/notes.json";
import ticketFixture from "../fixtures/ticket.json";
import blogFixture from "../fixtures/blog.json";
import emailFixture from "../fixtures/email.json";
import chatFixture from "../fixtures/chat.json";

/**
 * D4 · 线上业务 API 契约层
 *
 * 取证：线上 demo 覆盖 17 个页面后只发出 5 个业务 API 请求，其余 300+
 * 都是 Next.js RSC 预取 / _next/image / Cloudflare beacon。5 个端点为
 *   GET /api/notes  4 条  msg "Success"
 *   GET /api/ticket 8 条  msg "Success"
 *   GET /api/blog  11 条  msg "success"
 *   GET /api/email 20 条  msg "Success"
 *   GET /api/chat  10 条  msg "success"
 * 响应统一为 { status, msg, data } 信封。
 *
 * 本地免费版原有的 3 个 per-feature handlers 走 /api/data/... 与
 * /api/notes/{add,update,delete} 等动词路径，供 notes/blog/tickets 页面使用，
 * 这里只补线上的 RESTful GET 契约端点，两者互不冲突、不改动现有页面。
 * email / chat 是本地缺失的两个 feature，数据直接取线上响应做 fixture。
 */
const envelope = <T,>(data: T, msg = "Success"): ApiEnvelope<T> => ({
  status: 200,
  msg,
  data,
});

const notes = envelope(notesFixture);
const ticket = envelope(ticketFixture);
const blog = envelope(blogFixture, "success");
const email = envelope(emailFixture as unknown as EmailType[]);
const chat = envelope(chatFixture as unknown as ChatType[], "success");

export const onlineContractHandlers = [
  http.get("/api/notes", () => HttpResponse.json(notes)),
  http.get("/api/ticket", () => HttpResponse.json(ticket)),
  http.get("/api/blog", () => HttpResponse.json(blog)),
  http.get("/api/email", () => HttpResponse.json(email)),
  http.get("/api/chat", () => HttpResponse.json(chat)),
];
