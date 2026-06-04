import type { ChatRoom, Message, MessagePage, ReceiptEvent, User } from "../types/chat";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL;

const API_BASE =
  configuredApiBase && !shouldIgnoreConfiguredApiBase(configuredApiBase)
    ? configuredApiBase
    : getDefaultApiBase();

function shouldIgnoreConfiguredApiBase(value: string) {
  return value.includes("localhost") && !["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function getDefaultApiBase() {
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:8082";
  }

  return `${window.location.protocol}//${window.location.hostname}:8080`;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const parseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const body = await parseBody(response);

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: string }).error)
        : `Request failed with ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
};

export const api = {
  register: (payload: RegisterPayload) =>
    request<string>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  login: (payload: LoginPayload) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  users: (token: string) => request<User[]>("/api/allUsers", {}, token),

  createPrivateChat: (token: string, user1: number, user2: number) =>
    request<ChatRoom>(`/api/chatrooms/private?user1=${user1}&user2=${user2}`, {
      method: "POST"
    }, token),

  userChats: (token: string, userId: number) =>
    request<ChatRoom[]>(`/api/chatrooms/user/${userId}`, {}, token),

  messages: (token: string, chatRoomId: number, page = 0, size = 40) =>
    request<MessagePage>(`/api/messages/chat/${chatRoomId}?page=${page}&size=${size}`, {}, token),

  sendMessage: (token: string, chatRoomId: number, content: string) =>
    request<Message>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ chatRoomId, content })
    }, token),

  markDelivered: (token: string, messageId: number) =>
    request<ReceiptEvent>(`/api/messages/${messageId}/delivered`, { method: "POST" }, token),

  markRead: (token: string, messageId: number) =>
    request<ReceiptEvent>(`/api/messages/${messageId}/read`, { method: "POST" }, token)
};

export const apiBaseUrl = API_BASE;
