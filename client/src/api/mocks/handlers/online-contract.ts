import { http, HttpResponse } from "msw";
import type { ApiEnvelope } from "src/types/api";
import type { EmailType } from "src/types/apps/email";
import type { ChatType } from "src/types/apps/chat";
import emailFixture from "../fixtures/email.json";
import chatFixture from "../fixtures/chat.json";

/**
 * D4 · 线上业务 API 契约层（保留 email / chat）
 *
 * 原取证线上 demo 只发出 5 个业务 GET 请求（notes/ticket/blog/email/chat）。
 * notes/ticket/blog 模块已按需求关闭，仅保留 email / chat 两个契约端点，
 * 响应统一为 { status, msg, data } 信封。
 */
const envelope = <T,>(data: T, msg = "Success"): ApiEnvelope<T> => ({
  status: 200,
  msg,
  data,
});

const email = envelope(emailFixture as unknown as EmailType[]);
const chat = envelope(chatFixture as unknown as ChatType[], "success");

/** 仅保留 email/chat 契约端点；notes/ticket/blog 模块已关闭。 */
export const onlineContractHandlers = [
  http.get("/api/email", () => HttpResponse.json(email)),
  http.get("/api/chat", () => HttpResponse.json(chat)),
];
