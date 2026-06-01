import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { FilePlus2, Laugh, SendHorizontal } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";

const CHARACTER_LIMIT = 2000;

export const Composer = () => {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const publishTyping = useChatStore((state) => state.publishTyping);
  const [value, setValue] = useState("");
  const typingTimer = useRef<number>();

  const submit = async () => {
    if (!token || !currentUser || !activeRoomId || !value.trim()) return;
    const content = value.trim();
    setValue("");
    publishTyping(activeRoomId, currentUser.id, false);
    await sendMessage({ token, currentUserId: currentUser.id, chatRoomId: activeRoomId, content });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value.slice(0, CHARACTER_LIMIT);
    setValue(next);
    if (!activeRoomId || !currentUser) return;
    publishTyping(activeRoomId, currentUser.id, Boolean(next.trim()));
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => publishTyping(activeRoomId, currentUser.id, false), 1200);
  };

  return (
    <footer className="border-t border-chat-line bg-slate-50 px-4 py-3">
      <div className="flex items-end gap-2">
        <button className="grid h-11 w-11 place-items-center rounded-full text-slate-500 hover:bg-slate-200" title="Emoji" type="button">
          <Laugh size={22} />
        </button>
        <button className="grid h-11 w-11 place-items-center rounded-full text-slate-500 hover:bg-slate-200" title="Attach" type="button">
          <FilePlus2 size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <textarea
            className="max-h-36 min-h-11 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-chat-accent"
            placeholder="Type a message"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            disabled={!activeRoomId}
          />
          <div className="mt-1 text-right text-[11px] text-slate-400">{value.length}/{CHARACTER_LIMIT}</div>
        </div>
        <button
          className="grid h-11 w-11 place-items-center rounded-full bg-chat-accent text-white disabled:opacity-50"
          type="button"
          disabled={!value.trim() || !activeRoomId}
          onClick={() => void submit()}
          title="Send"
        >
          <SendHorizontal size={20} />
        </button>
      </div>
    </footer>
  );
};
