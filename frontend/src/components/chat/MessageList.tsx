import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { groupMessagesByDate } from "../../lib/messageGrouping";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "../../types/chat";

const EMPTY_MESSAGES: Message[] = [];

export const MessageList = () => {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const messages = useChatStore((state) => (activeRoomId ? state.messagesByRoom[activeRoomId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES));
  const pageState = useChatStore((state) => (activeRoomId ? state.messagePages[activeRoomId] : undefined));
  const loadOlderMessages = useChatStore((state) => state.loadOlderMessages);
  const retryMessage = useChatStore((state) => state.retryMessage);
  const markDelivered = useChatStore((state) => state.markDelivered);
  const markRead = useChatStore((state) => state.markRead);
  const groups = useMemo(() => groupMessagesByDate(messages), [messages]);
  const listRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef(0);
  const deliveredReceiptsRef = useRef<Set<number>>(new Set());
  const readReceiptsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    deliveredReceiptsRef.current.clear();
    readReceiptsRef.current.clear();
  }, [activeRoomId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 140;
    if (nearBottom) {
      requestAnimationFrame(() => list.scrollTo({ top: list.scrollHeight, behavior: "smooth" }));
    }
  }, [messages.length]);

  useEffect(() => {
    if (!token || !currentUser || !activeRoomId) return;

    for (const message of messages) {
      if (message.senderId === currentUser.id || typeof message.messageId !== "number" || message.deleted) {
        continue;
      }

      if (!deliveredReceiptsRef.current.has(message.messageId)) {
        deliveredReceiptsRef.current.add(message.messageId);
        void markDelivered(token, message.messageId);
      }

      if (!readReceiptsRef.current.has(message.messageId)) {
        readReceiptsRef.current.add(message.messageId);
        void markRead(token, message.messageId);
      }
    }
  }, [activeRoomId, currentUser, markDelivered, markRead, messages, token]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !previousHeightRef.current) return;
    const delta = list.scrollHeight - previousHeightRef.current;
    list.scrollTop += delta;
    previousHeightRef.current = 0;
  }, [messages[0]?.messageId]);

  const onScroll = async () => {
    if (!token || !activeRoomId || pageState?.last || pageState?.loadingOlder) return;
    const list = listRef.current;
    if (!list || list.scrollTop > 80) return;
    previousHeightRef.current = list.scrollHeight;
    await loadOlderMessages(token, activeRoomId);
  };

  if (!activeRoomId) {
    return <div className="grid h-full place-items-center text-sm text-slate-500">Choose a conversation to start messaging.</div>;
  }

  return (
    <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] px-5 py-4 scrollbar-thin">
      {pageState?.loadingOlder && <div className="mx-auto mb-3 w-fit rounded-full bg-white px-3 py-1 text-xs text-slate-500">Loading older messages...</div>}
      <div className="grid gap-2">
        {groups.map((group) => (
          <section key={group.label} className="grid gap-2">
            <div className="sticky top-2 z-10 mx-auto w-fit rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
              {group.label}
            </div>
            {group.messages.map((message) => {
              const mine = message.senderId === currentUser?.id;
              return (
                <MessageBubble
                  key={`${message.messageId}-${message.localId ?? ""}`}
                  message={message}
                  mine={mine}
                  onRetry={() => token && currentUser && activeRoomId && message.localId && retryMessage({ token, currentUserId: currentUser.id, chatRoomId: activeRoomId, localId: message.localId })}
                />
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
};
