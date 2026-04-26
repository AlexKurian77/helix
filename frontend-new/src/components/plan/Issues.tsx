import { Plan, Issue } from "@/lib/planData";

const SEV = {
  critical: { pill: "pill-critical", label: "critical", border: "border-l-critical", icon: "⚠" },
  moderate: { pill: "pill-warning", label: "moderate", border: "border-l-warning", icon: "◆" },
  suggestion: { pill: "pill-info", label: "suggestion", border: "border-l-info", icon: "+" },
} as const;

export const Issues = ({ plan, onFixAll }: { plan: Plan; onFixAll: () => void }) => {
  const issuesList = plan.issues || [];
  const counts = {
    critical: issuesList.filter((i) => i.severity === "critical").length,
    moderate: issuesList.filter((i) => i.severity === "moderate").length,
    suggestion: issuesList.filter((i) => i.severity === "suggestion").length,
  };
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="panel-title">issues & risks</span>
          {counts.critical > 0 && <span className="pill pill-critical">{counts.critical} critical</span>}
          {counts.moderate > 0 && <span className="pill pill-warning">{counts.moderate} moderate</span>}
          {counts.suggestion > 0 && <span className="pill pill-info">{counts.suggestion} suggestion</span>}
        </div>
        {issuesList.length > 1 && (
          <button onClick={onFixAll} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-medium inline-flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Fix all
          </button>
        )}
      </div>
      <div className="divide-y divide-border">
        {issuesList.length === 0 && (
          <div className="p-6 text-center">
            <div className="text-success text-2xl mb-1">✓</div>
            <div className="text-sm text-foreground font-medium">No outstanding issues</div>
            <div className="text-xs text-muted-foreground mt-0.5">Plan is execution-ready.</div>
          </div>
        )}
        {issuesList.map((i) => <IssueRow key={i.id} issue={i} />)}
      </div>
    </div>
  );
};

const IssueRow = ({ issue }: { issue: Issue }) => {
  const cfg = SEV[issue.severity];
  return (
    <div className={`p-4 border-l-2 ${cfg.border} hover:bg-surface-sunken transition-colors`}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`pill ${cfg.pill}`}>{cfg.label}</span>
          {issue.affects.length > 0 && (
            <span className="label-num">affects step{issue.affects.length > 1 ? "s" : ""} {issue.affects.map((s) => s.replace("s", "")).join(", ")}</span>
          )}
        </div>
      </div>
      <div className="text-sm font-medium text-foreground mb-1">{issue.title}</div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{issue.detail}</p>
      <div className="text-xs bg-surface-sunken border border-border rounded p-2.5 leading-relaxed">
        <span className="label-num mr-1.5">fix</span>
        <span className="text-foreground">{issue.fix}</span>
      </div>
      <div className="mt-2 flex gap-3">
        <button className="text-[11px] text-accent hover:underline">apply fix</button>
        <button className="text-[11px] text-muted-foreground hover:text-accent">dismiss</button>
        <button className="text-[11px] text-muted-foreground hover:text-accent">explain reasoning</button>
      </div>
    </div>
  );
};
