

import { InboxHandlers } from 'src/api/inbox/inbox-data';
import { onlineContractHandlers } from './online-contract';


/** 只保留 Inbox 与线上契约 mock；Blog / Notes / Ticket 模块已关闭，不再需要假数据。 */
export const mockHandlers = [
  // D4：线上商业版的 5 个 RESTful GET 契约端点
  ...onlineContractHandlers,
  ...InboxHandlers,
];
