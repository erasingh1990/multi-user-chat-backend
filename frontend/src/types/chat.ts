export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export type PresenceStatus = "online" | "offline";

export interface User {
  id: number;
  username: string;
  email: string;
  presence?: PresenceStatus;
  typing?: boolean;
}

export interface ChatRoom {
  chatRoomId: number;
  type: "PRIVATE" | "GROUP";
  participantIds: number[];
  createdAt: string;
}

export interface Message {
  messageId: number | string;
  senderId: number;
  content: string;
  createdAt: string;
  status: MessageStatus;
  localId?: string;
  failedReason?: string;
  editedAt?: string;
  deleted?: boolean;
}

export interface MessagePage {
  content: Message[];
  first: boolean;
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface ReceiptEvent {
  messageId: number;
  userId: number;
  chatRoomId: number;
  status: Exclude<MessageStatus, "SENDING" | "FAILED">;
  updatedAt: string;
}

export interface TypingEvent {
  chatRoomId: number;
  userId: number;
  typing: boolean;
}

export interface PresenceEvent {
  userId: number;
  status: PresenceStatus;
}

export interface MessageMutationEvent {
  chatRoomId: number;
  messageId: number;
  type: "EDITED" | "DELETED";
  content?: string;
  updatedAt: string;
}

export interface Conversation {
  room: ChatRoom;
  otherUser?: User;
  latestMessage?: Message;
  unreadCount: number;
  typingUserId?: number;
}
