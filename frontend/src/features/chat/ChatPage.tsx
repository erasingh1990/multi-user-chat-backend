import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChatWindow } from "../../components/chat/ChatWindow";
import { ConversationSidebar } from "../../components/chat/ConversationSidebar";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";

export const ChatPage = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const loadUsers = useChatStore((state) => state.loadUsers);
  const loadRooms = useChatStore((state) => state.loadRooms);
  const connectRealtime = useChatStore((state) => state.connectRealtime);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const rooms = useChatStore((state) => state.rooms);
  const conversations = useChatStore((state) => state.conversations);
  const openRoom = useChatStore((state) => state.openRoom);
  const refreshRoomMessages = useChatStore((state) => state.refreshRoomMessages);
  const initializedTokenRef = useRef<string>();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (initializedTokenRef.current === token) {
      return;
    }

    initializedTokenRef.current = token;
    connectRealtime();

    void (async () => {
      const resolvedUser = await loadUsers(token, currentUser?.email ?? getEmailFromToken(token));
      if (resolvedUser) {
        if (resolvedUser.id !== currentUser?.id) {
          setCurrentUser(resolvedUser);
        }
        await loadRooms(token, resolvedUser.id);
        return;
      }

      if (currentUser) {
        await loadRooms(token, currentUser.id);
      }
    })();
  }, [connectRealtime, currentUser, loadRooms, loadUsers, navigate, setCurrentUser, token]);

  useEffect(() => {
    if (!token || !activeRoomId) return;

    const intervalId = window.setInterval(() => {
      void refreshRoomMessages(token, activeRoomId);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [activeRoomId, refreshRoomMessages, token]);

  useEffect(() => {
    if (!token || !currentUser?.id) return;

    const intervalId = window.setInterval(() => {
      void loadRooms(token, currentUser.id);
      rooms.forEach((room) => {
        void refreshRoomMessages(token, room.chatRoomId);
      });
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [currentUser?.id, loadRooms, refreshRoomMessages, rooms, token]);

  useEffect(() => {
    if (!token || activeRoomId || conversations.length === 0) return;

    void openRoom(token, conversations[0].room.chatRoomId);
  }, [activeRoomId, conversations, openRoom, token]);

  return (
    <main className="grid h-screen grid-cols-1 overflow-hidden bg-slate-100 md:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr]">
      <ConversationSidebar />
      <ChatWindow />
    </main>
  );
};

const getEmailFromToken = (token: string) => {
  try {
    const [, payload] = token.split(".");
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalizedPayload)) as { sub?: string };
    return decoded.sub;
  } catch {
    return undefined;
  }
};
