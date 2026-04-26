import { Plan } from "@/lib/planData";

const SOURCE_CFG = {
  "lab-profile": { label: "lab profile", color: "text-info bg-info-soft" },
  "inferred": { label: "inferred", color: "text-warning bg-warning-soft" },
  "literature": { label: "literature", color: "text-novel bg-novel-soft" },
  "user": { label: "user", color: "text-accent bg-accent-soft" },
} as const;

export const ContextUsed = ({ plan }: { plan: Plan }) => (
  <div className="panel">
    <div className="panel-header">
      <span className="panel-title">context used · this is not generic</span>
      <span className="label-num">{plan.context.length} signals</span>
    </div>
    <div className="divide-y divide-border">
      {plan.context.map((c) => {
        const s = SOURCE_CFG[c.source];
        return (
          <div key={c.label} className="px-4 py-2 flex items-center gap-3 text-xs hover:bg-surface-sunken transition-colors">
            <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider ${s.color} shrink-0 w-[80px] text-center`}>
              {s.label}
            </span>
            <span className="text-muted-foreground shrink-0 w-[150px]">{c.label}</span>
            <span className="text-foreground font-medium truncate">{c.value}</span>
          </div>
        );
      })}
    </div>
  </div>
);
