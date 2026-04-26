import { useState } from "react";

interface Props {
  onSubmit: (h: string) => void;
  onRefine: (h: string) => Promise<string>;
  onHub?: () => void;
}

const EXAMPLES = [
  "Can we build a cheap, fast blood test for inflammation?",
  "Does a specific probiotic measurably strengthen the gut lining in mice?",
  "Can we keep more cells alive when freezing them by swapping preservatives?",
];

export const Landing = ({ onSubmit, onRefine, onHub }: Props) => {
  const [val, setVal] = useState(EXAMPLES[0]);
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async () => {
    if (!val.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refined = await onRefine(val);
      if (refined) setVal(refined);
    } catch (e) {
      console.error("Refinement failed", e);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border bg-surface/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onHub} className="flex items-center gap-2 group">
              <div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <span className="font-display text-base text-primary group-hover:text-accent transition-colors">Helix</span>
            </button>
            {onHub && (
              <>
                <span className="text-border ml-1">/</span>
                <button onClick={onHub} className="label-num hover:text-accent transition-colors">Hub</button>
                <span className="text-border">/</span>
              </>
            )}
            <span className="label-num">new research</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="label-num hidden md:inline">connected to: <span className="text-foreground">Chen Lab · BSL-2</span></span>
            <span className="pill pill-success">● online</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="space-y-2 mb-10">
          <span className="label-num">hypothesis → execution-ready plan</span>
          <h1 className="font-display text-5xl md:text-6xl text-primary tracking-tight text-balance leading-[1.05]">
            One sentence in.
            <br />
            <span className="italic text-accent">A real experiment</span> out.
          </h1>
          <p className="text-muted-foreground text-base max-w-xl pt-3 leading-relaxed">
            Helix grounds your hypothesis in literature, applies your lab's constraints,
            and returns a complete protocol — materials, timeline, risks, and budget — in seconds.
            Then refine it in plain English.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (val.trim()) onSubmit(val.trim()); }}
          className="panel shadow-[var(--shadow-raised)]"
        >
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="panel-title">hypothesis · free text</span>
            </div>
          </div>
          <div className="p-4">
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && val.trim()) onSubmit(val.trim());
              }}
              rows={4}
              placeholder="e.g. Knockdown of GENE X in CELL LINE will alter PHENOTYPE under CONDITION..."
              className="w-full bg-transparent text-[15px] leading-relaxed font-display text-primary resize-none outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-surface-sunken">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-success" />literature grounded</span>
              <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-success" />constraint aware</span>
              <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-success" />auditable</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefine}
                disabled={!val.trim() || isRefining}
                className="pill pill-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-40 flex items-center gap-2 border border-accent/20"
              >
                {isRefining ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Scientific-ify
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={!val.trim() || isRefining}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
              >
                Generate plan
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8m0 0L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6">
          <div className="label-num mb-2">try an example</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setVal(ex)}
                className="text-xs px-3 py-1.5 rounded border border-border bg-surface-raised hover:border-accent hover:text-accent text-muted-foreground transition-colors max-w-md text-left truncate"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-px bg-border border border-border rounded overflow-hidden text-xs">
          {[
            ["2.4M", "papers indexed"],
            ["340+", "lab profiles"],
            ["94%", "protocols executed without revision"],
          ].map(([n, l]) => (
            <div key={l} className="bg-surface-raised p-4">
              <div className="font-display text-2xl text-primary">{n}</div>
              <div className="label-num mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
