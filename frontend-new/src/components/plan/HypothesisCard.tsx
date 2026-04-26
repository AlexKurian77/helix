import { Plan } from "@/lib/planData";

export const HypothesisCard = ({
  plan,
  onExportReport,
  onCopyProtocol,
}: {
  plan: Plan;
  onExportReport: () => void | Promise<void>;
  onCopyProtocol: () => void | Promise<void>;
}) => (
  <div className="panel">
    <div className="panel-header">
      <div className="flex items-center gap-2">
        <span className="panel-title">hypothesis</span>
        <span className="label-num">· PLN-{plan.plan_id || "NEW"}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onExportReport} className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M3 1v8m0 0L1 7m2 2l2-2M7 11V3m0 0L5 5m2-2l2 2" stroke="currentColor" strokeWidth="1.2" /></svg>
          export PDF
        </button>
        <button onClick={onCopyProtocol} className="text-xs text-muted-foreground hover:text-accent">copy protocol</button>
        <button className="text-xs text-muted-foreground hover:text-accent">share</button>
      </div>
    </div>
    <div className="p-5">
      <p className="font-display text-xl text-primary leading-snug text-balance">{plan.query}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4 text-xs">
        <div><span className="label-num mr-1.5">technique</span><span className="text-foreground font-medium">{plan.experiment_plan.validation_method}</span></div>
        <div><span className="label-num mr-1.5">duration</span><span className="text-foreground font-medium">{plan.experiment_plan.total_duration}</span></div>
        <div><span className="label-num mr-1.5">cost</span><span className="text-foreground font-medium">${plan.experiment_plan.total_budget.toLocaleString()}</span></div>
      </div>
    </div>
  </div>
);
