/** D4 · GET /api/email 的数据项结构（按线上响应字段取证） */
export interface EmailAttachment {
  icon?: string;
  file?: string;
  fileSize?: string;
}

export interface EmailType {
  id: number;
  from: string;
  thumbnail: string;
  subject: string;
  time: string;
  To: string;
  emailExcerpt: string;
  emailContent: string;
  unread: boolean;
  attachment: boolean;
  starred: boolean;
  important: boolean;
  inbox: boolean;
  sent: boolean;
  draft: boolean;
  spam: boolean;
  trash: boolean;
  label: string;
  attchments: EmailAttachment[];
}
