import { useEffect, useState } from "react";
import { Globe, BookOpen, FlaskConical, Box } from "lucide-react";

interface Props { onEnter: () => void }

const REASONING_LINES = [
  { tag: "PARSE", text: "hypothesis decomposed → 3 entities, 1 mechanism" },
  { tag: "WORLD", text: "Chen Lab · BSL-2 · 14 instruments · 7 scientists" },
  { tag: "KNOWLEDGE", text: "847 papers retrieved · 12 protocols matched" },
  { tag: "STATE", text: "EXP-2017 similar (84%) · 2 reusable components" },
  { tag: "CONTEXT", text: "budget $2,500 · ChemiDoc free in 4h" },
  { tag: "PLAN", text: "protocol drafted · 8 steps · 14 days · $1,840" },
];

export const Marketing = ({ onEnter }: Props) => {
  const [shownLines, setShownLines] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setShownLines((n) => (n >= REASONING_LINES.length ? 0 : n + 1));
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border bg-surface/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent" />
            </div>
            <span className="font-display text-base text-primary">Helix</span>
            <span className="text-border ml-1">/</span>
            <span className="label-num">lab intelligence platform</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#how" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:inline">How it works</a>
            <a href="#layers" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:inline">Architecture</a>
            <a href="#proof" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:inline">Evidence</a>
            <span className="pill pill-success hidden sm:inline-flex">● v0.5-beta</span>
            <button
              onClick={onEnter}
              className="bg-primary text-primary-foreground px-3.5 py-1.5 rounded text-xs font-medium hover:bg-primary/90 inline-flex items-center gap-2"
            >
              Open Helix
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6h8m0 0L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1400px] mx-auto px-6">
        {/* HERO */}
        <section className="pt-20 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6 animate-reveal">
            <div className="flex items-center gap-2">
              <span className="pill pill-info">● lab intelligence</span>
              <span className="label-num">for wet-lab principal investigators</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-primary tracking-tight text-balance leading-[1.02]">
              Your lab has a memory.
              <br />
              <span className="italic text-accent">Helix gives it a mind.</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
              Helix continuously fuses your lab's equipment, scientists, budgets,
              prior experiments and the global literature into one reasoning system —
              so every new hypothesis returns an execution-ready plan, grounded in
              what you already know.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onEnter}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2 shadow-[var(--shadow-raised)]"
              >
                Enter the Lab Hub
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none"><path d="M2 6h8m0 0L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <a href="#how" className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5">
                See how it reasons →
              </a>
            </div>

            <div className="grid grid-cols-3 gap-px bg-border border border-border rounded overflow-hidden text-xs mt-10 max-w-xl">
              {[
                ["2.4M", "papers indexed"],
                ["340+", "lab profiles"],
                ["94%", "plans run without revision"],
              ].map(([n, l]) => (
                <div key={l} className="bg-surface-raised p-3.5">
                  <div className="font-display text-2xl text-primary leading-none">{n}</div>
                  <div className="label-num mt-1.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning monitor */}
          <div className="lg:col-span-5">
            <div className="panel shadow-[var(--shadow-raised)] overflow-hidden">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-ring" />
                  <span className="panel-title">helix · reasoning monitor</span>
                </div>
                <span className="label-num">live</span>
              </div>
              <div className="bg-surface-sunken border-b border-border px-4 py-3">
                <span className="label-num">hypothesis</span>
                <p className="font-display text-[15px] text-primary mt-1 leading-snug">
                  Knockdown of TFEB in HepG2 will reduce autophagic flux under glucose starvation.
                </p>
              </div>
              <div className="p-4 space-y-2 min-h-[260px] font-mono text-[12px]">
                {REASONING_LINES.slice(0, shownLines).map((l, i) => (
                  <div key={i} className="flex items-start gap-3 animate-reveal">
                    <span className="label-num text-accent w-20 shrink-0 pt-0.5">{l.tag}</span>
                    <span className="text-foreground">{l.text}</span>
                  </div>
                ))}
                {shownLines < REASONING_LINES.length && (
                  <div className="flex items-center gap-3">
                    <span className="label-num w-20 shrink-0">·</span>
                    <span className="text-muted-foreground cursor-blink">thinking</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-surface-sunken">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-success" />grounded</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-success" />constrained</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-success" />auditable</span>
                </div>
                <span className="label-num">4 layers fused</span>
              </div>
            </div>
          </div>
        </section>

        {/* LAYERS */}
        <section id="layers" className="py-16 border-t border-border">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <span className="label-num">the architecture</span>
              <h2 className="font-display text-3xl md:text-4xl text-primary mt-1 tracking-tight">
                Four layers. <span className="italic text-accent">One reasoning core.</span>
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Helix doesn't just answer — it reasons over a structured model of your lab's
              physical reality, scientific knowledge, and history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { code: "WORLD", title: "Facts", color: "text-info", bg: "bg-info-soft", icon: <Globe className="w-4 h-4" />, items: ["Lab infrastructure", "Equipment inventory", "Scientists & expertise", "Budget envelopes"] },
              { code: "KNOWLEDGE", title: "Methods", color: "text-novel", bg: "bg-novel-soft", icon: <BookOpen className="w-4 h-4" />, items: ["2.4M indexed papers", "Validated protocols", "Standard methodologies", "Domain-specific SOPs"] },
              { code: "STATE", title: "History", color: "text-success", bg: "bg-success-soft", icon: <FlaskConical className="w-4 h-4" />, items: ["Past experiments", "Outcomes & anomalies", "Reusable components", "Validated steps"] },
              { code: "CONTEXT", title: "Live Inputs", color: "text-accent", bg: "bg-accent-soft", icon: <Box className="w-4 h-4" />, items: ["Current constraints", "Resource snapshot", "Active calendar", "Selected protocols"] },
            ].map((l) => (
              <div key={l.code} className="panel p-4 flex flex-col gap-3 hover:border-accent transition-colors">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded ${l.bg} flex items-center justify-center text-base`}>{l.icon}</div>
                  <span className={`label-num ${l.color} font-bold`}>{l.code}</span>
                </div>
                <div className="font-display text-lg text-primary leading-tight">{l.title}</div>
                <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                  {l.items.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-accent mt-1">·</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="py-16 border-t border-border">
          <div className="max-w-2xl mb-10">
            <span className="label-num">the flow</span>
            <h2 className="font-display text-3xl md:text-4xl text-primary mt-1 tracking-tight">
              From sentence to <span className="italic text-accent">execution-ready plan</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-px bg-border border border-border rounded overflow-hidden">
            {[
              { n: "01", t: "Type the hypothesis", d: "One sentence. Plain English. Helix decomposes entities, mechanisms, and required readouts." },
              { n: "02", t: "Helix fuses the four layers", d: "Literature, your equipment, prior experiments, and live constraints are reasoned over together." },
              { n: "03", t: "Inspect the structured plan", d: "Protocol, materials, hardware, budget, timeline, risks, collaborators — all dense, all auditable." },
              { n: "04", t: "Steer in plain English", d: "“Reduce cost”, “add controls”, “use Dr. Mehta's protocol”. Every change is reasoned and diffed." },
            ].map((s) => (
              <div key={s.n} className="bg-surface-raised p-5 flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-3xl text-accent leading-none">{s.n}</span>
                  <span className="label-num">step</span>
                </div>
                <div className="font-display text-base text-primary leading-snug">{s.t}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROOF / DIFFERENTIATORS */}
        <section id="proof" className="py-16 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <span className="label-num">why it's different</span>
              <h2 className="font-display text-3xl md:text-4xl text-primary mt-1 tracking-tight">
                Not a chatbot. <br />
                <span className="italic text-accent">A research instrument.</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Generic LLMs hallucinate plans without context. Helix grounds every
                recommendation in your lab's verified inventory, your team's expertise,
                and the experiments you've already run.
              </p>
              <div className="mt-6 panel p-4 bg-surface-sunken">
                <span className="label-num text-accent">trust signal</span>
                <p className="text-sm text-foreground mt-1.5 leading-relaxed">
                  Every plan ships with a <span className="font-medium text-primary">Context Used</span> panel —
                  showing exactly which constraints, papers and prior experiments shaped it.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { t: "Lab-aware by default", d: "Plans respect your BSL level, equipment availability, and budget — no manual config." },
                { t: "Continuity, not cold starts", d: "Suggests reusing validated steps from prior experiments instead of rewriting protocols." },
                { t: "Collaborator matching", d: "Computes expertise overlap between the plan and every scientist on the team." },
                { t: "Auditable change log", d: "Every refinement shows what changed and why — diffed against the previous plan." },
                { t: "Risk-first design", d: "Critical / moderate / suggestion tiers surface conflicts before you hit the bench." },
                { t: "Findings mode", d: "Predicted outcomes, anomalies, and contradictions with prior work — not just a recipe." },
              ].map((f) => (
                <div key={f.t} className="panel p-4 hover:border-accent transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <div>
                      <div className="font-display text-[15px] text-primary leading-snug">{f.t}</div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 border-t border-border">
          <div className="text-center max-w-2xl mx-auto space-y-5">
            <span className="label-num">ready when you are</span>
            <h2 className="font-display text-4xl md:text-5xl text-primary tracking-tight text-balance leading-[1.05]">
              Open the Hub. <br />
              <span className="italic text-accent">Watch your lab think.</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              No setup. The Chen Lab demo environment is loaded — 7 scientists, 14 instruments, 24 prior experiments.
            </p>
            <div className="pt-3">
              <button
                onClick={onEnter}
                className="bg-primary text-primary-foreground px-6 py-3 rounded text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2 shadow-[var(--shadow-raised)]"
              >
                Enter Lab Intelligence Hub
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none"><path d="M2 6h8m0 0L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border bg-surface/60">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
            <span className="font-display text-sm text-primary">Helix</span>
            <span className="label-num ml-2">© 2026 · lab intelligence platform</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Chen Lab demo · BSL-2</span>
            <span className="pill pill-success">● online</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
