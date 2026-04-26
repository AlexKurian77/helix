import { Plan } from "@/lib/planData";

export const Timeline = ({ plan }: { plan: Plan }) => {
  const timeline = plan.experiment_plan.timeline;
  
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">timeline · {plan.experiment_plan.total_duration}</span>
        <span className="label-num">{timeline.length} phases</span>
      </div>
      <div className="divide-y divide-border">
        {timeline.map((p, i) => (
          <div key={i} className="p-4 hover:bg-surface-sunken transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-foreground">{p.phase}</div>
              <div className="text-xs font-mono text-muted-foreground">{p.duration}</div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

