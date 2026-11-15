

import { Bloghandlers } from 'src/api/blog/blogdata';
import { NotesHandlers } from 'src/api/notes/notedata';
import { TicketHandlers } from 'src/api/ticket/ticket-data';
import { InboxHandlers } from 'src/api/inbox/inbox-data';
import { WorkspaceHandlers } from 'src/api/workspace/workspace-data';
import { onlineContractHandlers } from './online-contract';


export const mockHandlers = [
  ...Bloghandlers,
  ...NotesHandlers,
  ...TicketHandlers,
  // D4：线上商业版的 5 个 RESTful GET 契约端点
  ...onlineContractHandlers,
  ...InboxHandlers,
  // PMS Workspace：六个工作区模块共用一份真实数据快照
  ...WorkspaceHandlers,
];
