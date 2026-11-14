/** D4 · GET /api/chat 的数据项结构（按线上响应字段取证） */
export interface ChatAttachment {
  icon: string;
  file: string;
  fileSize: string;
}

export interface ChatMessage {
  createdAt: string;
  msg: string;
  senderId: number;
  type: string;
  attachment: ChatAttachment[];
}

export interface ChatType {
  id: number;
  name: string;
  status: string;
  thumb: string;
  recent: boolean;
  excerpt: string;
  messages: ChatMessage[];
}
