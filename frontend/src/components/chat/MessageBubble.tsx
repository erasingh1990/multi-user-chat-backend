import { RotateCcw } from "lucide-react";
import { MessageStatusIcon } from "../status/MessageStatusIcon";
import type { Message } from "../../types/chat";

export const MessageBubble = ({
  message,
  mine,
  onRetry
}: {
  message: Message;
  mine: boolean;
  onRetry: () => void;
}) => (
  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
    <article
      className={`max-w-[min(680px,82%)] rounded-lg px-3 py-2 shadow-bubble ${mine ? "bg-chat-outgoing" : "bg-chat-incoming"}`}
      data-message-status={message.status}
    >
      <p className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed ${message.deleted ? "italic text-slate-500" : "text-slate-950"}`}>
        {message.content}
      </p>
      {message.editedAt && <span className="mr-2 text-[11px] text-slate-400">edited</span>}
      <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
        <span>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</span>
        {mine && <MessageStatusIcon status={message.status} />}
      </div>
      {message.status === "FAILED" && mine && (
        <button className="mt-2 inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700" onClick={onRetry}>
          <RotateCcw size={13} /> Retry
        </button>
      )}
    </article>
  </div>
);
