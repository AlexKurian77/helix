import { Plan } from "@/lib/planData";

export const Materials = ({ plan }: { plan: Plan }) => {
  const materials = plan.experiment_plan.materials;
  const total = materials.reduce((s, m) => s + m.estimated_cost, 0);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">materials · reagents & consumables</span>
        <span className="label-num">{materials.length} items · ${total.toLocaleString()}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-sunken text-left">
              <th className="px-4 py-2 label-num font-normal">item</th>
              <th className="px-2 py-2 label-num font-normal text-right">qty</th>
              <th className="px-2 py-2 label-num font-normal text-right">unit</th>
              <th className="px-4 py-2 label-num font-normal text-right">est. cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {materials.map((m, i) => (
              <tr key={i} className="hover:bg-surface-sunken transition-colors">
                <td className="px-4 py-2 text-foreground font-medium">{m.name}</td>
                <td className="px-2 py-2 text-right font-mono text-muted-foreground">{m.quantity}</td>
                <td className="px-2 py-2 text-right font-mono text-muted-foreground">{m.unit}</td>
                <td className="px-4 py-2 text-right font-mono text-foreground">${m.estimated_cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

