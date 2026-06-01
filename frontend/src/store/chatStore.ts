import { create } from "zustand";
import { api } from "../lib/api";
import { realtimeClient } from "../lib/realtime";
import type {
  ChatRoom,
  Conversation,
  Message,
  MessageMutationEvent,
  PresenceEvent,
  ReceiptEvent,
  TypingEvent,
  User
} from "../types/chat";

type SendMessageInput = {
  token: string;
  currentUserId: number;
  chatRoomId: number;
  content: string;
};

type ChatState = {
  users: User[];
  rooms: ChatRoom[];
  conversations: Conversation[];
  activeRoomId?: number;
  messagesByRoom: Record<number, Message[]>;
  messagePages: Record<number, { page: number; last: boolean; loadingOlder: boolean }>;
  realtimeConnected: boolean;
  sidebarLoading: boolean;
  messagesLoading: boolean;
  error?: string;
  loadUsers: (token: string, currentEmail?: string) => Promise<User | undefined>;
  loadRooms: (token: string, currentUserId: number) => Promise<void>;
  createPrivateChat: (token: string, currentUserId: number, otherUserId: number) => Promise<ChatRoom>;
  openRoom: (token: string, roomId: number) => Promise<void>;
  refreshRoomMessages: (token: string, roomId: number) => Promise<void>;
  loadOlderMessages: (token: string, roomId: number) => Promise<void>;
  sendMessage: (input: SendMessageInput) => Promise<void>;
  retryMessage: (input: Omit<SendMessageInput, "content"> & { localId: string }) => Promise<void>;
  markDelivered: (token: string, messageId: number) => Promise<void>;
  markRead: (token: string, messageId: number) => Promise<void>;
  connectRealtime: () => void;
  subscribeRoom: (roomId: number) => void;
  publishTyping: (roomId: number, userId: number, typing: boolean) => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  users: [],
  rooms: [],
  conversations: [],
  messagesByRoom: {},
  messagePages: {},
  realtimeConnected: false,
  sidebarLoading: false,
  messagesLoading: false,

  loadUsers: async (token, currentEmail) => {
    set({ sidebarLoading: true, error: undefined });
    const users = await api.users(token);
    const normalized = users.map((user) => ({ ...user, presence: user.presence ?? ("offline" as const) }));
    const currentUser = normalized.find((user) => user.email === currentEmail);
    set((state) => ({
      users: normalized,
      sidebarLoading: false,
      conversations: deriveConversations(state.rooms, normalized, state.messagesByRoom, currentUser?.id)
    }));
    return currentUser;
  },

  loadRooms: async (token, currentUserId) => {
    const rooms = await api.userChats(token, currentUserId);
    set((state) => ({
      rooms,
      conversations: deriveConversations(rooms, state.users, state.messagesByRoom, currentUserId)
    }));
    rooms.forEach((room) => get().subscribeRoom(room.chatRoomId));
  },

  createPrivateChat: async (token, currentUserId, otherUserId) => {
    const room = await api.createPrivateChat(token, currentUserId, otherUserId);
    set((state) => {
      const rooms = upsertRoom(state.rooms, room);
      return {
        rooms,
        activeRoomId: room.chatRoomId,
        conversations: deriveConversations(rooms, state.users, state.messagesByRoom, currentUserId)
      };
    });
    get().subscribeRoom(room.chatRoomId);
    await get().openRoom(token, room.chatRoomId);
    return room;
  },

  openRoom: async (token, roomId) => {
    set({ activeRoomId: roomId, messagesLoading: true });
    get().subscribeRoom(roomId);
    const page = await api.messages(token, roomId, 0, 50);
    const messages = [...page.content].reverse();
    set((state) => ({
      messagesLoading: false,
      messagesByRoom: { ...state.messagesByRoom, [roomId]: messages },
      messagePages: { ...state.messagePages, [roomId]: { page: 0, last: page.last, loadingOlder: false } },
      conversations: deriveConversations(state.rooms, state.users, { ...state.messagesByRoom, [roomId]: messages })
    }));
  },

  refreshRoomMessages: async (token, roomId) => {
    const page = await api.messages(token, roomId, 0, 50);
    const freshMessages = [...page.content].reverse();

    set((state) => {
      const existingMessages = state.messagesByRoom[roomId] ?? [];
      const messages = mergeMessages([...existingMessages, ...freshMessages]);
      const messagesByRoom = { ...state.messagesByRoom, [roomId]: messages };

      return {
        messagesByRoom,
        messagePages: {
          ...state.messagePages,
          [roomId]: {
            page: state.messagePages[roomId]?.page ?? 0,
            last: page.last,
            loadingOlder: state.messagePages[roomId]?.loadingOlder ?? false
          }
        },
        conversations: deriveConversations(state.rooms, state.users, messagesByRoom)
      };
    });
  },

  loadOlderMessages: async (token, roomId) => {
    const current = get().messagePages[roomId] ?? { page: 0, last: false, loadingOlder: false };
    if (current.last || current.loadingOlder) return;

    set((state) => ({
      messagePages: {
        ...state.messagePages,
        [roomId]: { ...current, loadingOlder: true }
      }
    }));

    const nextPage = current.page + 1;
    const page = await api.messages(token, roomId, nextPage, 50);
    const olderMessages = [...page.content].reverse();

    set((state) => {
      const existing = state.messagesByRoom[roomId] ?? [];
      const merged = mergeMessages([...olderMessages, ...existing]);
      const messagesByRoom = { ...state.messagesByRoom, [roomId]: merged };
      return {
        messagesByRoom,
        messagePages: {
          ...state.messagePages,
          [roomId]: { page: nextPage, last: page.last, loadingOlder: false }
        },
        conversations: deriveConversations(state.rooms, state.users, messagesByRoom)
      };
    });
  },

  sendMessage: async ({ token, currentUserId, chatRoomId, content }) => {
    const localId = createLocalId();
    const optimisticMessage: Message = {
      messageId: localId,
      localId,
      senderId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
      status: "SENDING"
    };

    set((state) => addMessageState(state, chatRoomId, optimisticMessage));

    try {
      const serverMessage = await api.sendMessage(token, chatRoomId, content);
      set((state) => replaceOptimisticMessageState(state, chatRoomId, localId, serverMessage));
    } catch (error) {
      set((state) => updateLocalMessageState(state, chatRoomId, localId, {
        status: "FAILED",
        failedReason: error instanceof Error ? error.message : "Failed to send"
      }));
    }
  },

  retryMessage: async ({ token, currentUserId, chatRoomId, localId }) => {
    const failed = get().messagesByRoom[chatRoomId]?.find((message) => message.localId === localId);
    if (!failed) return;
    set((state) => updateLocalMessageState(state, chatRoomId, localId, { status: "SENDING", failedReason: undefined }));
    await get().sendMessage({ token, currentUserId, chatRoomId, content: failed.content });
    set((state) => removeLocalMessageState(state, chatRoomId, localId));
  },

  markDelivered: async (token, messageId) => {
    const receipt = await api.markDelivered(token, messageId);
    set((state) => applyReceiptState(state, receipt));
  },

  markRead: async (token, messageId) => {
    const receipt = await api.markRead(token, messageId);
    set((state) => applyReceiptState(state, receipt));
  },

  connectRealtime: () => {
    realtimeClient.connect({
      onMessage: (message) => {
        const roomId = get().activeRoomId;
        if (!roomId) return;
        set((state) => addMessageState(state, roomId, message));
      },
      onReceipt: (receipt) => set((state) => applyReceiptState(state, receipt)),
      onTyping: (event) => set((state) => applyTypingState(state, event)),
      onPresence: (event) => set((state) => applyPresenceState(state, event)),
      onMutation: (event) => set((state) => applyMutationState(state, event)),
      onConnectionChange: (connected) => {
        set({ realtimeConnected: connected });
        if (connected) {
          get().rooms.forEach((room) => get().subscribeRoom(room.chatRoomId));
        }
      }
    });
  },

  subscribeRoom: (roomId) => {
    realtimeClient.subscribeToRoom(roomId, {
      onMessage: (message) => set((state) => addMessageState(state, roomId, message)),
      onReceipt: (receipt) => set((state) => applyReceiptState(state, receipt)),
      onTyping: (event) => set((state) => applyTypingState(state, event)),
      onPresence: (event) => set((state) => applyPresenceState(state, event)),
      onMutation: (event) => set((state) => applyMutationState(state, event)),
      onConnectionChange: (connected) => set({ realtimeConnected: connected })
    });
  },

  publishTyping: (roomId, userId, typing) => {
    realtimeClient.publishTyping(roomId, userId, typing);
  }
}));

const deriveConversations = (
  rooms: ChatRoom[],
  users: User[],
  messagesByRoom: Record<number, Message[]>,
  currentUserId?: number
): Conversation[] =>
  rooms
    .map((room) => {
      const otherUserId = room.participantIds.find((id) => id !== currentUserId);
      const messages = messagesByRoom[room.chatRoomId] ?? [];
      const latestMessage = messages.length ? messages[messages.length - 1] : undefined;
      return {
        room,
        otherUser: users.find((user) => user.id === otherUserId),
        latestMessage,
        unreadCount: messages.filter((message) => message.senderId !== currentUserId && message.status !== "READ").length
      };
    })
    .sort((a, b) => latestTime(b) - latestTime(a));

const latestTime = (conversation: Conversation) =>
  new Date(conversation.latestMessage?.createdAt ?? conversation.room.createdAt).getTime();

const upsertRoom = (rooms: ChatRoom[], room: ChatRoom) =>
  rooms.some((item) => item.chatRoomId === room.chatRoomId)
    ? rooms.map((item) => (item.chatRoomId === room.chatRoomId ? room : item))
    : [room, ...rooms];

const mergeMessages = (messages: Message[]) => {
  const byId = new Map<string, Message>();

  for (const message of messages) {
    const key = String(message.messageId);
    const existing = byId.get(key);
    byId.set(key, existing ? mergeMessage(existing, message) : message);
  }

  return [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

const mergeMessage = (existing: Message, incoming: Message): Message => ({
  ...existing,
  ...incoming,
  localId: existing.localId ?? incoming.localId,
  failedReason: incoming.failedReason ?? existing.failedReason,
  status: highestStatus(existing.status, incoming.status)
});

const addMessageState = (state: ChatState, roomId: number, message: Message): Partial<ChatState> => {
  const existing = state.messagesByRoom[roomId] ?? [];
  const messages = mergeMessages([...existing, message]);
  const messagesByRoom = { ...state.messagesByRoom, [roomId]: messages };
  return {
    messagesByRoom,
    conversations: deriveConversations(state.rooms, state.users, messagesByRoom)
  };
};

const replaceOptimisticMessageState = (
  state: ChatState,
  roomId: number,
  localId: string,
  serverMessage: Message
): Partial<ChatState> => {
  const messages = (state.messagesByRoom[roomId] ?? []).map((message) =>
    message.localId === localId ? { ...serverMessage, localId } : message
  );
  const messagesByRoom = { ...state.messagesByRoom, [roomId]: messages };
  return {
    messagesByRoom,
    conversations: deriveConversations(state.rooms, state.users, messagesByRoom)
  };
};

const updateLocalMessageState = (
  state: ChatState,
  roomId: number,
  localId: string,
  patch: Partial<Message>
): Partial<ChatState> => ({
  messagesByRoom: {
    ...state.messagesByRoom,
    [roomId]: (state.messagesByRoom[roomId] ?? []).map((message) =>
      message.localId === localId ? { ...message, ...patch } : message
    )
  }
});

const removeLocalMessageState = (state: ChatState, roomId: number, localId: string): Partial<ChatState> => ({
  messagesByRoom: {
    ...state.messagesByRoom,
    [roomId]: (state.messagesByRoom[roomId] ?? []).filter((message) => message.localId !== localId)
  }
});

const applyReceiptState = (state: ChatState, receipt: ReceiptEvent): Partial<ChatState> => {
  const messages = (state.messagesByRoom[receipt.chatRoomId] ?? []).map((message) =>
    Number(message.messageId) === receipt.messageId ? { ...message, status: highestStatus(message.status, receipt.status) } : message
  );
  const messagesByRoom = { ...state.messagesByRoom, [receipt.chatRoomId]: messages };
  return {
    messagesByRoom,
    conversations: deriveConversations(state.rooms, state.users, messagesByRoom)
  };
};

const applyTypingState = (state: ChatState, event: TypingEvent): Partial<ChatState> => ({
  conversations: state.conversations.map((conversation) =>
    conversation.room.chatRoomId === event.chatRoomId
      ? { ...conversation, typingUserId: event.typing ? event.userId : undefined }
      : conversation
  )
});

const applyPresenceState = (state: ChatState, event: PresenceEvent): Partial<ChatState> => {
  const users = state.users.map((user) =>
    user.id === event.userId ? { ...user, presence: event.status } : user
  );
  return {
    users,
    conversations: deriveConversations(state.rooms, users, state.messagesByRoom)
  };
};

const applyMutationState = (state: ChatState, event: MessageMutationEvent): Partial<ChatState> => {
  const messages = (state.messagesByRoom[event.chatRoomId] ?? []).map((message) => {
    if (Number(message.messageId) !== event.messageId) return message;
    if (event.type === "DELETED") return { ...message, deleted: true, content: "This message was deleted" };
    return { ...message, content: event.content ?? message.content, editedAt: event.updatedAt };
  });
  return {
    messagesByRoom: {
      ...state.messagesByRoom,
      [event.chatRoomId]: messages
    }
  };
};

const statusRank: Record<Message["status"], number> = {
  SENDING: 0,
  FAILED: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3
};

const highestStatus = (current: Message["status"], incoming: Message["status"]) =>
  statusRank[incoming] > statusRank[current] ? incoming : current;

const createLocalId = () => {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
