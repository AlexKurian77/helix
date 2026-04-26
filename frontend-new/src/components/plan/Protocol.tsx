import { Plan, ProtocolStep } from "@/lib/planData";
import { useState } from "react";

export const Protocol = ({ plan }: { plan: Plan }) => {
  const protocol = plan.experiment_plan.protocol;
  const [open, setOpen] = useState<number | null>(protocol.length > 0 ? protocol[0].step_number : null);

  const renderTextWithCitations = (text: string | null) => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match && plan.experiment_plan.citations) {
        const citeIndex = parseInt(match[1]) - 1;
        const citation = plan.experiment_plan.citations[citeIndex];
        
        if (citation && citation.url) {
          return (
            <a
              key={index}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs mx-0.5 px-1 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors inline-block translate-y-[-1px]"
              title={citation.title}
            >
              {part}
            </a>
          );
        } else if (citation) {
          return (
            <span 
              key={index} 
              className="font-mono text-xs mx-0.5 px-1 py-0.5 rounded bg-info/10 text-info inline-block translate-y-[-1px]"
              title={citation.title}
            >
              {part}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">protocol · {protocol.length} steps</span>
        <span className="label-num">total {plan.experiment_plan.total_duration}</span>
      </div>
      <div className="divide-y divide-border">
        {protocol.map((s) => (
          <Step 
            key={s.step_number} 
            step={s} 
            open={open === s.step_number} 
            onToggle={() => setOpen(open === s.step_number ? null : s.step_number)} 
            renderText={renderTextWithCitations}
          />
        ))}
      </div>
    </div>
  );
};

const Step = ({ step, open, onToggle, renderText }: { step: ProtocolStep; open: boolean; onToggle: () => void; renderText: (t: string | null) => React.ReactNode }) => (
  <div className={`group transition-colors hover:bg-surface-sunken`}>
    <button onClick={onToggle} className="w-full px-4 py-3 flex items-start gap-3 text-left">
      <div className={`shrink-0 w-7 h-7 rounded font-mono text-xs flex items-center justify-center font-medium bg-primary text-primary-foreground`}>
        {step.step_number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{step.title}</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono mt-0.5">⏱ {step.duration}</div>
        {open && (
          <div className="mt-3 space-y-2 animate-reveal">
            <p className="text-sm text-foreground/90 leading-relaxed">{renderText(step.description)}</p>
            {step.notes && (
              <div className="flex items-start gap-2 text-xs bg-warning-soft border-l-2 border-warning px-3 py-2 rounded-r">
                <svg className="w-3.5 h-3.5 text-warning shrink-0 mt-px" viewBox="0 0 14 14" fill="none"><path d="M7 2L1 12h12L7 2zM7 6v3M7 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                <span className="text-foreground">{renderText(step.notes)}</span>
              </div>
            )}
            <div className="pt-1 flex gap-2">
              <button className="text-[11px] text-accent hover:underline">edit step</button>
              <span className="text-border">·</span>
              <button className="text-[11px] text-muted-foreground hover:text-accent">add note</button>
              <span className="text-border">·</span>
              <button className="text-[11px] text-muted-foreground hover:text-accent">why this step?</button>
            </div>
          </div>
        )}
      </div>
      <svg className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  </div>
);
