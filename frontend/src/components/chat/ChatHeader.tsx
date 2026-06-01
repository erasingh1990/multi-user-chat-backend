import { MoreVertical, Phone, Search, Video } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";

export const ChatHeader = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const conversations = useChatStore((state) => state.conversations);
  const realtimeConnected = useChatStore((state) => state.realtimeConnected);
  const conversation = conversations.find((item) => item.room.chatRoomId === activeRoomId);
  const other = conversation?.otherUser;
  const typing = conversation?.typingUserId && conversation.typingUserId !== currentUser?.id;

  return (
    <header className="flex h-16 items-center justify-between border-b border-chat-line bg-white px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative grid h-11 w-11 place-items-center rounded-full bg-slate-300 font-semibold text-slate-700">
          {(other?.username ?? "C").slice(0, 1).toUpperCase()}
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${other?.presence === "online" ? "bg-emerald-500" : "bg-slate-300"}`} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-950">{other?.username ?? "Select a conversation"}</h2>
          <p className="truncate text-xs text-slate-500">
            {typing ? "typing..." : other ? `${other.presence ?? "offline"} · ${realtimeConnected ? "live" : "reconnecting"}` : "No active chat"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-slate-500">
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" title="Search"><Search size={19} /></button>
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" title="Voice call"><Phone size={19} /></button>
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" title="Video call"><Video size={19} /></button>
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" title="More"><MoreVertical size={19} /></button>
      </div>
    </header>
  );
};
