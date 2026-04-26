import { useEffect, useRef, useState } from "react";
import { ChatMessage, seedAssistantMessage } from "@/lib/labData";
import { API_BASE_URL } from "@/lib/api";

const SUGGESTIONS = [
  "What did we learn from the starvation timecourse?",
  "Has anyone tested bafilomycin dose-response?",
  "What's the status of the PD-L1 CRISPR work?",
  "Who in the lab knows about TFEB biology?",
];


export const MentorChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([seedAssistantMessage]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");
    setThinking(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      
      if (!res.ok) throw new Error("Chat failed");
      
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant" as const, content: data.content }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant" as const, content: "Sorry, I lost my connection to the lab's memory. Please try again." }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-ring" />
          <span className="panel-title">lab mentor · context-aware</span>
        </div>
        <span className="label-num">grounded in STATE + WORLD</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {messages.map((m, i) => (
          <Message key={i} msg={m} />
        ))}
        {thinking && (
          <div className="flex items-start gap-2 animate-reveal">
            <div className="w-6 h-6 rounded bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="text-xs text-muted-foreground font-mono italic pt-1">
              consulting lab history<span className="cursor-blink" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="px-3 pt-2 pb-1.5 border-t border-border bg-surface-sunken">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={thinking}
              className="text-[11px] px-2 py-0.5 rounded border border-border bg-surface-raised hover:border-accent hover:text-accent text-muted-foreground transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-surface-raised"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={thinking}
          placeholder="Ask about past work, methods, or lab capacity…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
};

const Message = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.role === "user";
  // Light markdown: **bold** and *italic*
  const html = msg.content
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-accent">$1</em>');

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-6 h-6 rounded shrink-0 flex items-center justify-center text-[10px] font-mono font-medium ${
        isUser ? "bg-primary text-primary-foreground" : "bg-accent/15 border border-accent/30 text-accent"
      }`}>
        {isUser ? "you" : "lm"}
      </div>
      <div className={`max-w-[85%] text-xs leading-relaxed rounded px-3 py-2 ${
        isUser ? "bg-primary text-primary-foreground" : "bg-surface-sunken border border-border text-foreground"
      }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
