import { useLabData } from "@/lib/useLabData";

const CAT = {
  imaging: "imaging",
  molecular: "molecular",
  "cell-culture": "cell culture",
  analytical: "analytical",
  general: "general",
} as const;

export const Hardware = () => {
  const { equipment, isLoading } = useLabData();

  if (isLoading) {
    return (
      <div className="panel animate-pulse">
        <div className="panel-header">
          <span className="panel-title">hardware · equipment</span>
        </div>
        <div className="p-8 flex justify-center">
          <span className="label-num italic">Checking inventory...</span>
        </div>
      </div>
    );
  }

  // Handle missing 'required' property from backend for now
  const required = equipment.filter((e) => (e as any).required);
  const optional = equipment.filter((e) => !(e as any).required);
  const conflicts = equipment.filter((e) => (e as any).required && !e.available);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="panel-title">hardware · equipment</span>
          {conflicts.length > 0 ? (
            <span className="pill pill-critical">{conflicts.length} conflict</span>
          ) : (
            <span className="pill pill-success">all available</span>
          )}
        </div>
        <span className="label-num">{required.length} required · {optional.length} optional</span>
      </div>

      <div className="divide-y divide-border">
        {[...required, ...optional].map((e) => (
          <div key={e.name} className="px-4 py-2.5 flex items-center gap-3 text-xs hover:bg-surface-sunken transition-colors">
            <div className={`w-7 h-7 shrink-0 rounded flex items-center justify-center font-mono text-[10px] uppercase tracking-wider ${
              e.required ? "bg-primary text-primary-foreground" : "bg-surface-sunken border border-border text-muted-foreground"
            }`}>
              {e.required ? "REQ" : "opt"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium truncate">{e.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {CAT[e.category]} · {e.location}
                {e.bookedUntil && <span className="text-warning"> · booked until {e.bookedUntil}</span>}
              </div>
            </div>
            <span className={`pill ${e.available ? "pill-success" : "pill-critical"}`}>
              {e.available ? "available" : "in use"}
            </span>
          </div>
        ))}
      </div>

      {conflicts.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-critical-soft/40 text-xs text-foreground">
          <span className="label-num text-critical mr-2">conflict</span>
          {conflicts.map((c) => c.name).join(", ")} required but unavailable. Reschedule or reroute to alternate instrument.
        </div>
      )}
    </div>
  );
};
