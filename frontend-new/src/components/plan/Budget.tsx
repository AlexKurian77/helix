import { Plan } from "@/lib/planData";

export const Budget = ({ plan }: { plan: Plan }) => {
  const budget = plan.experiment_plan.budget;
  const total = plan.experiment_plan.total_budget;
  
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">budget breakdown</span>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <span className="font-display text-3xl text-primary">${total.toLocaleString()}</span>
          <span className="text-muted-foreground ml-2 text-sm">total estimated cost</span>
        </div>

        <div className="space-y-1.5">
          {budget.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1">
              <span className="text-muted-foreground font-medium w-24 truncate" title={b.category}>{b.category}</span>
              <span className="text-foreground flex-1 truncate" title={b.item}>{b.item}</span>
              <span className="text-foreground font-mono">${b.cost.toLocaleString()}</span>
              {total > 0 && (
                <span className="text-muted-foreground font-mono w-10 text-right">{((b.cost / total) * 100).toFixed(0)}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

