import { Plan } from "@/lib/planData";

interface Diff {
  type: "added" | "removed" | "changed";
  field: string;
  before?: string;
  after?: string;
}

interface Props {
  before: Plan;
  after: Plan;
  reasoning: string;
  command: string;
  onAccept: () => void;
  onDiscard: () => void;
}

export const DiffView = ({ before, after, reasoning, command, onAccept, onDiscard }: Props) => {
  const diffs: Diff[] = [
    { type: "changed", field: "QC match", before: before.literature_qc?.status ?? "—", after: after.literature_qc?.status ?? "—" },
    { type: "changed", field: "Confidence score", before: `${before.confidence?.score ?? "—"}`, after: `${after.confidence?.score ?? "—"}` },
    { type: "changed", field: "Total cost", before: `$${before.experiment_plan?.total_budget ?? 0}`, after: `$${after.experiment_plan?.total_budget ?? 0}` },
    { type: "changed", field: "Timeline", before: before.experiment_plan?.total_duration ?? "—", after: after.experiment_plan?.total_duration ?? "—" },
    { type: "added", field: "Bafilomycin A1 flux control arm", after: "+ 100 nM, 2h co-treatment at Day 4" },
    { type: "added", field: "qPCR knockdown validation", after: "+ TFEB mRNA quantification at Day 4" },
    { type: "added", field: "anti-p62/SQSTM1 (CST 5114)", after: "+ added to immunoblot panel" },
    { type: "added", field: "6h starvation arm", after: "+ literature-validated control timepoint" },
    { type: "removed", field: "Critical issue: short starvation window", after: "resolved via dual-arm design" },
    { type: "removed", field: "Critical issue: missing TFEB knockdown validation", after: "resolved via qPCR" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="panel shadow-[var(--shadow-raised)]">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <span className="pill pill-info">comparison · before vs after</span>
              <span className="label-num">command: "{command}"</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onDiscard} className="text-xs px-3 py-1.5 rounded border border-border hover:border-border-strong text-foreground">
                Discard
              </button>
              <button onClick={onAccept} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 inline-flex items-center gap-1.5">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Accept changes
              </button>
            </div>
          </div>

          {/* Reasoning */}
          <div className="p-5 border-b border-border bg-accent-soft/40">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-7 h-7 rounded bg-accent text-accent-foreground flex items-center justify-center text-xs font-mono">why</div>
              <div className="flex-1">
                <div className="label-num mb-1">change reasoning · full-plan reconciliation</div>
                <p className="text-sm text-foreground leading-relaxed">{reasoning}</p>
              </div>
            </div>
          </div>

          {/* Side-by-side summary */}
          <div className="grid grid-cols-2 divide-x divide-border">
            <PlanSummary plan={before} side="before" />
            <PlanSummary plan={after} side="after" />
          </div>
        </div>

        {/* Diff list */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">changes · {diffs.length}</span>
            <span className="label-num">all updates traceable</span>
          </div>
          <div className="divide-y divide-border">
            {diffs.map((d, i) => (
              <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                <span className={`shrink-0 w-5 h-5 rounded font-mono text-xs flex items-center justify-center font-medium ${
                  d.type === "added" ? "bg-success-soft text-success" :
                  d.type === "removed" ? "bg-critical-soft text-critical" :
                  "bg-info-soft text-info"
                }`}>
                  {d.type === "added" ? "+" : d.type === "removed" ? "−" : "Δ"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-medium">{d.field}</div>
                  {d.type === "changed" && (
                    <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                      <span className="text-critical line-through">{d.before}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-success">{d.after}</span>
                    </div>
                  )}
                  {d.type !== "changed" && (
                    <div className={`text-xs mt-0.5 ${d.type === "added" ? "text-success" : "text-muted-foreground"}`}>{d.after}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlanSummary = ({ plan, side }: { plan: Plan; side: "before" | "after" }) => (
  <div className={`p-5 ${side === "before" ? "bg-surface-sunken" : ""}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="label-num">{side}</span>
      <span className="label-num">{plan.plan_id ?? "—"}</span>
    </div>
    <div className="space-y-2 text-sm">
      <Row label="QC match" value={plan.literature_qc?.status ?? "—"} />
      <Row label="Confidence" value={`${plan.confidence?.score ?? "—"} / 100`} />
      <Row label="Cost" value={`$${plan.experiment_plan?.total_budget?.toLocaleString() ?? "—"}`} />
      <Row label="Duration" value={plan.experiment_plan?.total_duration ?? "—"} />
      <Row label="Open issues" value={`${(plan.issues ?? []).length}`} />
      <Row label="Critical" value={`${(plan.issues ?? []).filter(i => i.severity === "critical").length}`} />
    </div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="font-mono text-xs text-foreground">{value}</span>
  </div>
);
