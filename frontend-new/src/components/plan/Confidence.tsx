import { Plan } from "@/lib/planData";

const IMPACT = {
  positive: { sym: "+", cls: "text-success bg-success-soft" },
  negative: { sym: "−", cls: "text-critical bg-critical-soft" },
  neutral: { sym: "·", cls: "text-muted-foreground bg-muted" },
} as const;

export const Confidence = ({ plan }: { plan: Plan }) => {
  const conf = plan.confidence;
  if (!conf) return null;

  const score = conf.score;
  const color = score >= 85 ? "hsl(var(--success))" : score >= 65 ? "hsl(var(--warning))" : "hsl(var(--critical))";
  const label = score >= 85 ? "High" : score >= 65 ? "Moderate" : "Low";

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">confidence · why</span>
        <span className="label-num">audited</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" stroke="hsl(var(--border))" strokeWidth="4" fill="none" />
              <circle
                cx="32" cy="32" r="28"
                stroke={color}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 175.9} 175.9`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-lg leading-none text-primary">{score}</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{label} confidence</div>
            <div className="text-xs text-muted-foreground leading-snug max-w-[200px] mt-0.5">
              Score reflects literature support, reagent availability, and methodological rigor — not just keyword overlap.
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {conf.factors.map((f) => {
            const im = IMPACT[f.impact as keyof typeof IMPACT] || IMPACT.neutral;
            return (
              <div key={f.factor} className="flex items-start gap-2 text-xs">
                <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center font-mono text-sm font-medium ${im.cls}`}>{im.sym}</span>
                <div>
                  <div className="text-foreground font-medium">{f.factor}</div>
                  <div className="text-muted-foreground leading-relaxed">{f.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
