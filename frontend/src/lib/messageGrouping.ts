import type { Message } from "../types/chat";
import { dateGroupLabel } from "./time";

export interface MessageGroup {
  label: string;
  messages: Message[];
}

export const groupMessagesByDate = (messages: Message[]): MessageGroup[] => {
  const groups = new Map<string, Message[]>();

  for (const message of messages) {
    const label = dateGroupLabel(message.createdAt);
    const group = groups.get(label) ?? [];
    group.push(message);
    groups.set(label, group);
  }

  return Array.from(groups.entries()).map(([label, group]) => ({
    label,
    messages: group
  }));
};
