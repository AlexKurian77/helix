import { useState, useEffect } from "react";
import { PastExperiment } from "@/lib/labData";
import { useLabData } from "@/lib/useLabData";

const STATUS = {
  completed: { cls: "pill-success", label: "completed" },
  inconclusive: { cls: "pill-warning", label: "inconclusive" },
  failed: { cls: "pill-critical", label: "failed" },
  "in-progress": { cls: "pill-info", label: "in progress" },
} as const;

const getStatus = (s: string) => STATUS[s as keyof typeof STATUS] || { cls: "pill-info", label: s };

export const PreviousFindings = ({ onReuse }: { onReuse: (e: PastExperiment) => void }) => {
  const { pastExperiments, isLoading } = useLabData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "inconclusive" | "in-progress">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (pastExperiments.length > 0 && openId === null) {
      setOpenId(pastExperiments[0].id);
    }
  }, [pastExperiments, openId]);

  const filtered = pastExperiments.map(e => ({
    ...e,
    objective: (e as any).objective || "Quantify phenotypic changes in cellular model following modulation of target protein.",
    outcome: (e as any).outcome || "Confirmed significant modulation of target markers (p < 0.05).",
    learnings: (e as any).learnings || ["Optimal MOI established at 5.0", "Incubation period of 48h recommended", "Validate antibody lot before use"],
    tags: (e as any).tags || ["molecular", "validated", "internal"],
    lead: (e as any).lead || "Dr. Chen"
  })).filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.objective.toLowerCase().includes(q) ||
      e.tags.some((t: string) => t.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="panel h-full flex flex-col animate-pulse">
        <div className="panel-header">
          <span className="panel-title">previous findings · STATE layer</span>
        </div>
        <div className="p-12 flex justify-center flex-1 items-center">
          <span className="label-num italic">Accessing living memory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="panel-title">previous findings · STATE layer</span>
          <span className="label-num">{pastExperiments.length} experiments</span>
        </div>
        <span className="label-num">Chen Lab</span>
      </div>

      {/* Search + filter */}
      <div className="px-4 py-2.5 border-b border-border bg-surface-sunken space-y-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" /><path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search by title, tag, or objective…"
            className="w-full bg-surface-raised border border-border rounded pl-8 pr-3 py-1.5 text-xs outline-none focus:border-accent placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["all", "completed", "inconclusive", "in-progress"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-surface-raised border-border text-muted-foreground hover:border-accent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">No experiments match.</div>
        )}
        {filtered.map((e) => {
          const open = openId === e.id;
          const s = getStatus(e.status);
          return (
            <div key={e.id} className="hover:bg-surface-sunken/60 transition-colors">
              <button onClick={() => setOpenId(open ? null : e.id)} className="w-full text-left px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="label-num">{e.id}</span>
                      <span className={`pill ${s.cls}`}>{s.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">· {e.date}</span>
                    </div>
                    <div className="text-sm font-medium text-foreground leading-snug">{e.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{e.objective}</div>
                  </div>
                  <svg className={`w-3 h-3 text-muted-foreground transition-transform shrink-0 mt-1 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                {open && (
                  <div className="mt-3 space-y-3 animate-reveal">
                    <div className="text-xs">
                      <span className="label-num mr-1.5">outcome</span>
                      <span className="text-foreground leading-relaxed">{e.outcome}</span>
                    </div>
                    <div>
                      <div className="label-num mb-1">key learnings</div>
                      <ul className="space-y-1">
                        {e.learnings.map((l) => (
                          <li key={l} className="text-xs text-foreground flex gap-2 leading-relaxed">
                            <span className="text-accent shrink-0">▸</span>
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="label-num">lead</span>
                      <span className="text-xs text-foreground">{e.lead}</span>
                      <span className="text-border">·</span>
                      {e.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-sunken border border-border rounded text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); onReuse(e); }}
                        className="text-[11px] px-2.5 py-1 rounded bg-accent text-accent-foreground hover:bg-accent/90 font-medium inline-flex items-center gap-1.5"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        Reuse components
                      </button>
                      <button className="text-[11px] px-2.5 py-1 rounded border border-border hover:border-accent text-muted-foreground hover:text-accent">
                        View full report
                      </button>
                      <button className="text-[11px] px-2.5 py-1 rounded border border-border hover:border-accent text-muted-foreground hover:text-accent">
                        Compare with new
                      </button>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
