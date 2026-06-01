import { AlertCircle, Clock3 } from "lucide-react";
import type { MessageStatus } from "../../types/chat";

export const MessageStatusIcon = ({ status }: { status: MessageStatus }) => {
  if (status === "SENDING") {
    return <Clock3 className="shrink-0 text-slate-400" size={14} aria-label="Sending" />;
  }

  if (status === "FAILED") {
    return <AlertCircle className="shrink-0 text-red-500" size={14} aria-label="Failed to send" />;
  }

  if (status === "SENT") {
    return <TickIcon label="Sent" color="#667781" single />;
  }

  return <TickIcon label={status === "READ" ? "Read" : "Delivered"} color={status === "READ" ? "#34b7f1" : "#667781"} />;
};

const TickIcon = ({
  color,
  label,
  single = false
}: {
  color: string;
  label: string;
  single?: boolean;
}) => (
  <svg
    aria-label={label}
    className="ml-0.5 inline-block h-[15px] w-[22px] shrink-0"
    fill="none"
    role="img"
    viewBox="0 0 19 13"
    xmlns="http://www.w3.org/2000/svg"
  >
    {!single && (
      <path
        d="M1.2 7.1L4.6 10.4L11.7 2.2"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    )}
    <path
      d={single ? "M5.1 7.1L8.5 10.4L15.6 2.2" : "M7.1 7.1L10.5 10.4L17.6 2.2"}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);
