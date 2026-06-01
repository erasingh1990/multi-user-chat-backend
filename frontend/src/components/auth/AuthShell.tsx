import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

export const AuthShell = ({ children, title, subtitle }: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) => (
  <main className="grid min-h-screen grid-cols-1 bg-slate-100 lg:grid-cols-[minmax(460px,0.9fr)_1.1fr]">
    <section className="flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-chat-accent text-white">
            <MessageCircle size={25} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
    <section className="hidden bg-[radial-gradient(circle_at_20%_20%,#e8f7f3_0,#d7ede8_28%,#f6faf9_70%)] p-10 lg:flex lg:flex-col lg:justify-between">
      <div className="max-w-xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-chat-accent">Messaging workspace</p>
        <h2 className="text-4xl font-semibold leading-tight text-slate-950">
          Real-time private conversations with delivery awareness.
        </h2>
      </div>
      <div className="grid max-w-2xl gap-3 rounded-lg border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="ml-auto max-w-sm rounded-lg bg-chat-outgoing p-3 shadow-bubble">Hey, can you review the deployment notes?</div>
        <div className="max-w-sm rounded-lg bg-white p-3 shadow-bubble">Yes. I’ll check and mark it read once done.</div>
        <div className="ml-auto max-w-sm rounded-lg bg-chat-outgoing p-3 shadow-bubble">Perfect. Thanks.</div>
      </div>
    </section>
  </main>
);
