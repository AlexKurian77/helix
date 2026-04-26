import { useState } from "react";

const QUICK = [
  { label: "Reduce cost", icon: "$" },
  { label: "Make faster", icon: "⏱" },
  { label: "Improve safety", icon: "⚐" },
  { label: "Add controls", icon: "+" },
  { label: "Use past experiment", icon: "↺" },
  { label: "Optimize based on lab history", icon: "◐" },
  { label: "Find best collaborator", icon: "👤" },
];

interface Props { onCommand: (cmd: string) => void | Promise<void>; busy?: boolean; lastAnswer?: string | null }

export const CommandBar = ({ onCommand, busy, lastAnswer }: Props) => {
  const [val, setVal] = useState("");
  return (
    <div className="sticky bottom-0 z-30 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4">
      {lastAnswer && (
        <div className="mb-4 px-4 py-3 bg-[hsl(var(--accent-soft)/0.5)] backdrop-blur-md border border-accent/20 border-l-4 border-l-accent rounded-r-lg rounded-l-sm shadow-lg animate-reveal">
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <span className="text-accent-foreground text-[10px] font-bold">AI</span>
            </div>
            <div className="text-sm text-foreground leading-relaxed font-medium">
              {lastAnswer}
            </div>
          </div>
        </div>
      )}
      <div className="panel shadow-[var(--shadow-raised)] overflow-hidden">
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5 border-b border-border bg-surface-sunken">
          <span className="label-num self-center mr-1">steer</span>
          {QUICK.map((q) => (
            <button
              key={q.label}
              disabled={busy}
              onClick={() => onCommand(q.label)}
              className="text-xs px-2.5 py-1 rounded border border-border bg-surface-raised hover:border-accent hover:text-accent text-foreground transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span className="text-muted-foreground font-mono">{q.icon}</span>
              {q.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (val.trim() && !busy) { onCommand(val.trim()); setVal(""); } }}
          className="flex items-center gap-2 px-4 py-2.5"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            disabled={busy}
            placeholder={busy ? "Reasoning over full plan…" : "Ask anything about this plan — or refine it (e.g. 'add bafilomycin flux control')"}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <span className="label-num hidden md:inline">⏎</span>
          <button
            type="submit"
            disabled={!val.trim() || busy}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-40"
          >
            {busy ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};
