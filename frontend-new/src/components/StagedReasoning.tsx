import { useEffect, useState, useRef } from "react";

const STAGES = [
  { label: "Parsing hypothesis", detail: "Identifying organism, gene targets, and measurable readouts", ms: 700 },
  { label: "Loading WORLD layer", detail: "Lab inventory · 5 researchers · 8 instruments · BSL-2 · $2,500 cap", ms: 800 },
  { label: "Searching KNOWLEDGE", detail: "Cross-referencing 2.4M papers + 14 internal SOPs · Klionsky guidelines", ms: 1000 },
  { label: "Querying STATE", detail: "Matched 3 prior experiments — EXP-2017, EXP-2009, EXP-1842", ms: 900 },
  { label: "Fusing CONTEXT", detail: "Reconciling live availability with planned protocol dependencies", ms: 800 },
  { label: "Auditing for risks & conflicts", detail: "Antibody inventory, timeline feasibility, statistical power", ms: 700 },
  { label: "Compiling execution plan", detail: "Materializing protocol, budget, hardware, timeline, confidence", ms: 600 },
];

interface Props {
  /** Called once the staged animation is done AND data is ready */
  onComplete: () => void;
  /** When true, the data has arrived and we can finish */
  dataReady: boolean;
  /** If set, an error occurred during data fetch */
  error?: string | null;
}

export const StagedReasoning = ({ onComplete, dataReady, error }: Props) => {
  const [stage, setStage] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const completedRef = useRef(false);

  // Advance through animated stages
  useEffect(() => {
    if (stage >= STAGES.length) {
      setAnimDone(true);
      return;
    }
    const t = setTimeout(() => setStage((s) => s + 1), STAGES[stage].ms);
    return () => clearTimeout(t);
  }, [stage]);

  // Once both animation is done AND data is ready (or errored), fire onComplete
  useEffect(() => {
    if (!animDone) return;
    if (!dataReady && !error) return;
    if (completedRef.current) return;
    completedRef.current = true;
    const t = setTimeout(onComplete, 350);
    return () => clearTimeout(t);
  }, [animDone, dataReady, error, onComplete]);

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center px-6">
      <div className="w-full max-w-2xl panel relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none animate-shimmer" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />

        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-ring" />
            <span className="panel-title">Reasoning trace</span>
          </div>
          <span className="label-num">PLN-2041-A</span>
        </div>

        <div className="panel-body space-y-3">
          {STAGES.map((s, i) => {
            const isLastStage = i === STAGES.length - 1;
            let status: "done" | "active" | "pending";

            if (i < stage) {
              status = "done";
            } else if (i === stage) {
              status = "active";
            } else {
              status = "pending";
            }

            // Keep the last stage "active" (pulsing) until data arrives
            if (isLastStage && animDone && !dataReady && !error) {
              status = "active";
            }

            return (
              <div
                key={s.label}
                className={`flex items-start gap-3 transition-opacity ${status === "pending" ? "opacity-30" : "opacity-100"}`}
              >
                <div className="mt-1 w-4 flex justify-center">
                  {status === "done" && (
                    <svg className="w-3.5 h-3.5 text-success" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {status === "active" && <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                  {status === "pending" && <div className="w-1.5 h-1.5 rounded-full border border-border-strong" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${status === "active" ? "text-foreground" : "text-foreground/80"}`}>
                    {s.label}
                    {status === "active" && <span className="cursor-blink" />}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{s.detail}</div>
                </div>
                {status === "done" && (
                  <span className="label-num text-success">OK</span>
                )}
              </div>
            );
          })}

          {/* Show error inline if the API failed */}
          {error && animDone && (
            <div className="flex items-start gap-3 mt-2 animate-reveal">
              <div className="mt-1 w-4 flex justify-center">
                <div className="w-2 h-2 rounded-full bg-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-destructive">Error encountered</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{error}</div>
              </div>
              <span className="label-num text-destructive">ERR</span>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-surface-sunken flex items-center justify-between">
          <span className="label-num">
            {animDone && !dataReady && !error
              ? `stage ${STAGES.length} / ${STAGES.length} · waiting for response…`
              : `stage ${Math.min(stage + 1, STAGES.length)} / ${STAGES.length}`}
          </span>
          <span className="label-num">grounded · constraint-aware · auditable</span>
        </div>
      </div>
    </div>
  );
};
