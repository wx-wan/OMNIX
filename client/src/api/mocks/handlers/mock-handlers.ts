

import { Bloghandlers } from 'src/api/blog/blogdata';
import { NotesHandlers } from 'src/api/notes/notedata';
import { TicketHandlers } from 'src/api/ticket/ticket-data';
import { onlineContractHandlers } from './online-contract';


export const mockHandlers = [
  ...Bloghandlers,
  ...NotesHandlers,
  ...TicketHandlers,
  // D4：线上商业版的 5 个 RESTful GET 契约端点
  ...onlineContractHandlers,
];
