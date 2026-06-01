import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

export const ChatWindow = () => (
  <section className="grid min-h-0 grid-rows-[auto_1fr_auto] bg-white">
    <ChatHeader />
    <MessageList />
    <Composer />
  </section>
);
