export type InboxNotificationType = "Mention" | "Activity" | "Assignment";

/** 点击通知后右栏展示的关联事项详情 */
export interface InboxDetail {
  issueNumber: string;
  title: string;
  description: string;
  activityActor: string;
  activityAvatar: string;
  activityTime: string;
}

export interface InboxNotification {
  id: string;
  actorName: string;
  avatar: string;
  type: InboxNotificationType;
  message: string;
  /** just now / 1d ago / 11月7日 —— 与 PMS 留存一致 */
  time: string;
  unread: boolean;
  detail: InboxDetail;
}

export interface InboxViewOptions {
  sort: string;
  typeLabel: boolean;
  messagePreview: boolean;
  time: boolean;
  readItems: boolean;
  snoozedItems: boolean;
  activityUpdates: boolean;
  unreadOnTop: boolean;
}
