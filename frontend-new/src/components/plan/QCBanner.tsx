import { Plan } from "@/lib/planData";
import { ExternalLink } from "lucide-react";

export const QCBanner = ({ plan }: { plan: Plan }) => {
  const { status, message, references } = plan.literature_qc;
  const cfg = {
    exact_match: { pill: "pill-success", label: "Exact match", dot: "bg-success" },
    similar_work_exists: { pill: "pill-info", label: "Similar prior work", dot: "bg-info" },
    not_found: { pill: "pill-novel", label: "Novel hypothesis", dot: "bg-novel" },
  }[status] || { pill: "pill-novel", label: "Analysis complete", dot: "bg-novel" };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-4 lg:p-5 border-b lg:border-b-0 lg:border-r border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className={`pill ${cfg.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
            </span>
            <span className="label-num">literature grounding</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed text-balance">{message}</p>
        </div>
        {references.length > 0 && (
          <div className="lg:w-[380px] p-4 lg:p-5 bg-surface-sunken">
            <div className="label-num mb-2">supporting references ({references.length})</div>
            <div className="space-y-2">
              {references.map((r, i) => {
                const targetUrl = r.url || `https://scholar.google.com/scholar?q=${encodeURIComponent(r.title)}`;
                return (
                  <a
                    key={i}
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-2 text-xs hover:bg-surface-raised -mx-2 px-2 py-1.5 rounded transition-colors"
                  >
                    <div className="font-mono text-[10px] mt-0.5 px-1.5 py-0.5 bg-surface-raised border border-border rounded text-muted-foreground shrink-0 flex items-center justify-center">
                      {Math.round(r.relevance_score * 100)}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground group-hover:text-accent transition-colors leading-snug flex items-center gap-1.5">
                        <span className="italic line-clamp-2">{r.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <div className="text-muted-foreground font-mono text-[10px] mt-0.5 capitalize">{r.type} · {r.domain}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
