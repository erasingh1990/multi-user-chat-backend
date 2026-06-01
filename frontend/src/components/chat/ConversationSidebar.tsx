import { LogOut, MessageSquarePlus, Search } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { formatConversationTime } from "../../lib/time";

export const ConversationSidebar = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const users = useChatStore((state) => state.users);
  const conversations = useChatStore((state) => state.conversations);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const openRoom = useChatStore((state) => state.openRoom);
  const createPrivateChat = useChatStore((state) => state.createPrivateChat);

  const contacts = users.filter((user) => user.id !== currentUser?.id);

  return (
    <aside className="flex min-h-0 flex-col border-r border-chat-line bg-chat-sidebar">
      <header className="flex h-16 items-center justify-between border-b border-chat-line px-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{currentUser?.username ?? "Chat"}</p>
          <p className="text-xs text-slate-500">{currentUser?.email}</p>
        </div>
        <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-200" title="Logout">
          <LogOut size={18} />
        </button>
      </header>

      <div className="border-b border-chat-line p-3">
        <div className="flex h-10 items-center gap-2 rounded-md bg-white px-3 text-slate-500">
          <Search size={17} />
          <input className="h-full flex-1 bg-transparent text-sm outline-none" placeholder="Search or start new chat" />
        </div>
      </div>

      <section className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Conversations</div>
        {conversations.length === 0 && (
          <div className="px-4 py-8 text-sm text-slate-500">No conversations yet. Start one below.</div>
        )}
        {conversations.map((conversation) => (
          <button
            key={conversation.room.chatRoomId}
            className={`grid w-full grid-cols-[44px_1fr_auto] gap-3 border-b border-chat-line px-4 py-3 text-left hover:bg-white ${
              activeRoomId === conversation.room.chatRoomId ? "bg-white" : ""
            }`}
            onClick={() => token && openRoom(token, conversation.room.chatRoomId)}
          >
            <Avatar name={conversation.otherUser?.username ?? "User"} online={conversation.otherUser?.presence === "online"} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{conversation.otherUser?.username ?? "Unknown user"}</div>
              <div className="truncate text-sm text-slate-500">
                {conversation.typingUserId ? "typing..." : conversation.latestMessage?.content ?? "No messages yet"}
              </div>
            </div>
            <div className="grid justify-items-end gap-1">
              <span className="text-xs text-slate-400">{formatConversationTime(conversation.latestMessage?.createdAt ?? conversation.room.createdAt)}</span>
              {activeRoomId !== conversation.room.chatRoomId && conversation.unreadCount > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-chat-accent px-1.5 text-xs font-semibold text-white">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </button>
        ))}

        <div className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">New chats</div>
        {contacts.map((user) => (
          <button
            key={user.id}
            className="grid w-full grid-cols-[44px_1fr_auto] gap-3 border-b border-chat-line px-4 py-3 text-left hover:bg-white"
            onClick={() => token && currentUser && createPrivateChat(token, currentUser.id, user.id)}
          >
            <Avatar name={user.username} online={user.presence === "online"} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{user.username}</div>
              <div className="truncate text-sm text-slate-500">{user.email}</div>
            </div>
            <MessageSquarePlus className="self-center text-slate-400" size={18} />
          </button>
        ))}
      </section>
    </aside>
  );
};

const Avatar = ({ name, online }: { name: string; online: boolean }) => (
  <div className="relative grid h-11 w-11 place-items-center rounded-full bg-slate-300 text-sm font-semibold text-slate-700">
    {name.slice(0, 1).toUpperCase()}
    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-chat-sidebar ${online ? "bg-emerald-500" : "bg-slate-300"}`} />
  </div>
);
