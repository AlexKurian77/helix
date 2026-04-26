import { Plan } from "@/lib/planData";

export const PlanHeader = ({ plan, onNew, onHub }: { plan: Plan; onNew: () => void; onHub?: () => void }) => (
  <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur-md">
    <div className="max-w-[1400px] mx-auto px-6 h-12 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onHub ?? onNew} className="flex items-center gap-2 group">
          <div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
          <span className="font-display text-base text-primary group-hover:text-accent transition-colors">Helix</span>
        </button>
        <span className="text-border">/</span>
        {onHub && (
          <>
            <button onClick={onHub} className="label-num hover:text-accent transition-colors">Hub</button>
            <span className="text-border">/</span>
          </>
        )}
        <span className="label-num">PLN-{plan.plan_id || "NEW"}</span>
        <span className="pill pill-success">● execution-ready</span>
      </div>
      <div className="flex items-center gap-1">
        <HeaderBtn>↗ export PDF</HeaderBtn>
        <HeaderBtn>copy protocol</HeaderBtn>
        <HeaderBtn>share</HeaderBtn>
        <button onClick={onNew} className="ml-2 text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          + New plan
        </button>
      </div>
    </div>
  </header>
);

const HeaderBtn = ({ children }: { children: React.ReactNode }) => (
  <button className="text-xs px-2.5 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors">
    {children}
  </button>
);
