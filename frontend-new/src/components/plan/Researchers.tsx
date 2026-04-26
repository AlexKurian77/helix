import { useMemo, useState, useEffect } from "react";
import { Plan } from "@/lib/planData";
import { scoreResearchers } from "@/lib/labData";
import { useLabData } from "@/lib/useLabData";

const AVAIL = {
  available: { dot: "bg-success", label: "available" },
  limited: { dot: "bg-warning", label: "limited" },
  busy: { dot: "bg-critical", label: "busy" },
} as const;

export const Researchers = ({ plan }: { plan: Plan }) => {
  const { researchers, isLoading } = useLabData();
  const ranked = useMemo(() => 
    researchers.length > 0 
      ? scoreResearchers(plan.query + " " + (plan.experiment_plan?.title || ""), researchers)
      : [], 
    [plan, researchers]
  );
  
  const [assigned, setAssigned] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  // Initialize assigned with the top match once data is loaded
  useEffect(() => {
    if (ranked.length > 0 && assigned.length === 0) {
      setAssigned([ranked[0].id]);
    }
  }, [ranked, assigned.length]);

  const toggle = (id: string) =>
    setAssigned((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  if (isLoading) {
    return (
      <div className="panel animate-pulse">
        <div className="panel-header">
          <span className="panel-title">researchers · WORLD</span>
        </div>
        <div className="p-8 flex justify-center">
          <span className="label-num italic">Loading lab roster...</span>
        </div>
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">researchers · WORLD</span>
        </div>
        <div className="p-8 text-center">
          <span className="label-num italic text-muted-foreground">No researchers found in database.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="panel-title">researchers · WORLD</span>
          <span className="label-num">match scored</span>
        </div>
        <span className="label-num">{assigned.length} assigned</span>
      </div>
      <div className="divide-y divide-border">
        {ranked.map((r) => {
          const isOpen = openId === r.id;
          const isAssigned = assigned.includes(r.id);
          const a = AVAIL[r.availability];
          const score = r.matchScore ?? 0;
          const ringColor = score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))";
          return (
            <div key={r.id} className={`transition-colors ${isAssigned ? "bg-accent-soft/30" : "hover:bg-surface-sunken"}`}>
              <button onClick={() => setOpenId(isOpen ? null : r.id)} className="w-full px-4 py-3 flex items-start gap-3 text-left">
                {/* Match ring */}
                <div className="relative w-10 h-10 shrink-0">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="17" stroke="hsl(var(--border))" strokeWidth="2.5" fill="none" />
                    <circle cx="20" cy="20" r="17" stroke={ringColor} strokeWidth="2.5" fill="none"
                      strokeLinecap="round" strokeDasharray={`${(score / 100) * 106.8} 106.8`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-medium text-foreground">{score}%</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    <span className="label-num">· {r.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                    <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">{a.label} · {r.hoursThisWeek}h/wk</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.matchReason}</div>

                  {isOpen && (
                    <div className="mt-3 space-y-2 animate-reveal">
                      <div className="flex flex-wrap gap-1">
                        {r.expertise.map((e) => (
                          <span key={e} className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-sunken border border-border rounded text-muted-foreground">{e}</span>
                        ))}
                      </div>
                      <div className="text-xs text-foreground leading-relaxed">
                        <span className="label-num mr-1.5">past work</span>{r.pastWork}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(r.id); }}
                    className={`text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                      isAssigned
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border hover:border-accent text-muted-foreground hover:text-accent"
                    }`}
                  >
                    {isAssigned ? "✓ assigned" : "+ assign"}
                  </button>
                  <button onClick={(e) => e.stopPropagation()} className="text-[10px] text-muted-foreground hover:text-accent">
                    request mentor
                  </button>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
