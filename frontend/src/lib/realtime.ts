import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { apiBaseUrl } from "./api";
import type { Message, MessageMutationEvent, PresenceEvent, ReceiptEvent, TypingEvent } from "../types/chat";

type Handlers = {
  onMessage: (message: Message) => void;
  onReceipt: (receipt: ReceiptEvent) => void;
  onTyping: (event: TypingEvent) => void;
  onPresence: (event: PresenceEvent) => void;
  onMutation: (event: MessageMutationEvent) => void;
  onConnectionChange: (connected: boolean) => void;
};

export class RealtimeClient {
  private client?: Client;
  private subscriptions = new Map<string, StompSubscription>();

  connect(handlers: Handlers) {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrl}/ws`),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => handlers.onConnectionChange(true),
      onDisconnect: () => handlers.onConnectionChange(false),
      onWebSocketClose: () => handlers.onConnectionChange(false),
      onStompError: () => handlers.onConnectionChange(false)
    });

    this.client.activate();
  }

  subscribeToRoom(chatRoomId: number, handlers: Handlers) {
    if (!this.client?.connected) return;

    this.unsubscribeRoom(chatRoomId);

    this.subscriptions.set(
      `messages:${chatRoomId}`,
      this.client.subscribe(`/topic/chat/${chatRoomId}`, (frame) => {
        handlers.onMessage(parse<Message>(frame));
      })
    );

    this.subscriptions.set(
      `receipts:${chatRoomId}`,
      this.client.subscribe(`/topic/chat/${chatRoomId}/receipts`, (frame) => {
        handlers.onReceipt(parse<ReceiptEvent>(frame));
      })
    );

    this.subscriptions.set(
      `typing:${chatRoomId}`,
      this.client.subscribe(`/topic/chat/${chatRoomId}/typing`, (frame) => {
        handlers.onTyping(parse<TypingEvent>(frame));
      })
    );

    this.subscriptions.set(
      `mutations:${chatRoomId}`,
      this.client.subscribe(`/topic/chat/${chatRoomId}/events`, (frame) => {
        handlers.onMutation(parse<MessageMutationEvent>(frame));
      })
    );
  }

  subscribePresence(handlers: Handlers) {
    if (!this.client?.connected || this.subscriptions.has("presence")) return;

    this.subscriptions.set(
      "presence",
      this.client.subscribe("/topic/presence", (frame) => {
        handlers.onPresence(parse<PresenceEvent>(frame));
      })
    );
  }

  unsubscribeRoom(chatRoomId: number) {
    for (const key of [
      `messages:${chatRoomId}`,
      `receipts:${chatRoomId}`,
      `typing:${chatRoomId}`,
      `mutations:${chatRoomId}`
    ]) {
      this.subscriptions.get(key)?.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  publishTyping(chatRoomId: number, userId: number, typing: boolean) {
    if (!this.client?.connected) return;

    this.client.publish({
      destination: `/app/chat/${chatRoomId}/typing`,
      body: JSON.stringify({ chatRoomId, userId, typing })
    });
  }

  disconnect() {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
    this.client?.deactivate();
  }
}

const parse = <T>(frame: IMessage): T => JSON.parse(frame.body) as T;

export const realtimeClient = new RealtimeClient();
