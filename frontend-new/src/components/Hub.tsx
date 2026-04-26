import { PreviousFindings } from "@/components/hub/PreviousFindings";
import { MentorChat } from "@/components/hub/MentorChat";
import { useLabData } from "@/lib/useLabData";
import { Globe, BookOpen, FlaskConical, Box } from "lucide-react";

interface Props { onStart: () => void }

export const Hub = ({ onStart }: Props) => {
  const { researchers, equipment, pastExperiments, isLoading } = useLabData();
  
  const availResearchers = Array.isArray(researchers) ? researchers.filter((r) => r.availability === "available").length : 0;
  const availEquip = Array.isArray(equipment) ? equipment.filter((e) => e.available).length : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="label-num italic animate-pulse">Initializing Lab Intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1500px] mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <span className="font-display text-base text-primary">Helix</span>
            </div>
            <span className="text-border">/</span>
            <span className="label-num">Lab Intelligence Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="label-num hidden md:inline">Chen Lab · BSL-2 · v0.5-beta</span>
            <span className="pill pill-success">● online</span>
            <button
              onClick={onStart}
              className="ml-2 bg-primary text-primary-foreground px-3.5 py-1.5 rounded text-xs font-medium hover:bg-primary/90 inline-flex items-center gap-2"
            >
              Start new research
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6h8m0 0L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-[1500px] mx-auto px-6 py-6 space-y-5 animate-reveal">
        {/* Title row */}
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="label-num">welcome back, dr. chen</span>
            <h1 className="font-display text-3xl md:text-4xl text-primary mt-1 tracking-tight">
              Your lab's <span className="italic text-accent">living memory</span>.
            </h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-2xl leading-relaxed">
              Helix continuously indexes everything the lab has done, owns, and knows —
              past experiments, equipment, researchers, and validated methods —
              so every new plan starts with full context.
            </p>
          </div>

          {/* Live snapshot */}
          <div className="grid grid-cols-4 gap-px bg-border border border-border rounded overflow-hidden text-xs min-w-[420px]">
            {[
              { n: pastExperiments.length, l: "past experiments" },
              { n: researchers.length, l: "scientists" },
              { n: `${availEquip}/${equipment.length}`, l: "instruments free" },
              { n: availResearchers, l: "available now" },
            ].map((s) => (
              <div key={s.l} className="bg-surface-raised p-3">
                <div className="font-display text-xl text-primary leading-none">{s.n}</div>
                <div className="label-num mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { code: "WORLD", icon: <Globe className="w-4 h-4" />, desc: "Lab · equipment · researchers · budgets", color: "text-info" },
            { code: "KNOWLEDGE", icon: <BookOpen className="w-4 h-4" />, desc: "Literature · protocols · methodologies", color: "text-novel" },
            { code: "STATE", icon: <FlaskConical className="w-4 h-4" />, desc: `${pastExperiments.length} prior experiments · outcomes · learnings`, color: "text-success" },
            { code: "CONTEXT", icon: <Box className="w-4 h-4" />, desc: "Live constraints · current availability", color: "text-accent" },
          ].map((l) => (
            <div key={l.code} className="panel p-3 flex items-start gap-2.5">
              <div className="mt-0.5">{l.icon}</div>
              <div className="min-w-0">
                <div className={`label-num ${l.color} font-bold`}>{l.code}</div>
                <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{l.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
          <div className="lg:col-span-7 h-[680px]">
            <PreviousFindings onReuse={() => onStart()} />
          </div>
          <div className="lg:col-span-5 h-[680px]">
            <MentorChat />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="panel p-5 flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-surface-raised to-accent-soft/30">
          <div>
            <div className="font-display text-lg text-primary">Ready to design a new experiment?</div>
            <div className="text-xs text-muted-foreground mt-0.5">Helix will fuse WORLD + KNOWLEDGE + STATE + CONTEXT into an execution-ready plan.</div>
          </div>
          <button
            onClick={onStart}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
          >
            Start new research
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none"><path d="M2 6h8m0 0L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </main>
    </div>
  );
};
