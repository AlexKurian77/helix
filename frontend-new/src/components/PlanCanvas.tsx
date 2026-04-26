import { useState, useEffect } from "react";
import { Plan } from "@/lib/planData";
import { PlanHeader } from "@/components/plan/PlanHeader";
import { HypothesisCard } from "@/components/plan/HypothesisCard";
import { QCBanner } from "@/components/plan/QCBanner";
import { Protocol } from "@/components/plan/Protocol";
import { Materials } from "@/components/plan/Materials";
import { Budget } from "@/components/plan/Budget";
import { Timeline } from "@/components/plan/Timeline";
import { FindingsView } from "@/components/plan/FindingsView";
import { Issues } from "@/components/plan/Issues";
import { CommandBar } from "@/components/plan/CommandBar";
import { Researchers } from "@/components/plan/Researchers";
import { Confidence } from "@/components/plan/Confidence";

interface Props { hypothesis: string; onNew: () => void; onHub: () => void }

export const PlanCanvas = ({ hypothesis, onNew, onHub }: Props) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"planning" | "findings">("planning");

  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: hypothesis }),
        });
        if (!res.ok) {
          let errorMsg = `Server error: ${res.status}`;
          try {
            const text = await res.text();
            try {
              const errData = JSON.parse(text);
              if (errData.detail) {
                errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
              }
            } catch (e) {
              if (text) errorMsg = text;
            }
          } catch (e) {}
          throw new Error(errorMsg);
        }
        const data = await res.json();
        // Derive issues from backend risks for the Issues component
        const issues = (data.risks || []).map((r: any) => ({
          id: r.id,
          severity: r.severity === "low" ? "suggestion" : r.severity,
          affects: [],
          title: r.title,
          detail: r.detail,
          fix: r.mitigation,
        }));
        const plan: Plan = {
          ...data,
          issues,
        };
        setPlan(plan);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [hypothesis]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <div className="label-num text-primary animate-pulse">Designing experiment...</div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="text-destructive font-display">Error generating plan</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <button onClick={onNew} className="text-accent hover:underline text-sm mt-4">Try again</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      <PlanHeader plan={plan} onNew={onNew} onHub={onHub} />

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-4 animate-reveal">
        <HypothesisCard plan={plan} />
        <QCBanner plan={plan} />

        <div className="flex items-center justify-between mt-6 border-b border-transparent pb-4">
          <div className="flex bg-surface-sunken p-1 rounded-md border border-border w-fit">
            <button
              onClick={() => setActiveTab("planning")}
              className={`flex items-center gap-3 px-4 py-2 rounded shadow-sm border transition-all ${
                activeTab === "planning" ? "bg-surface border-border opacity-100 text-foreground" : "bg-transparent border-transparent opacity-60 hover:opacity-100 text-muted-foreground"
              }`}
            >
              <div className="flex w-3.5 h-3.5 border border-current rounded-[3px] overflow-hidden shrink-0 opacity-80">
                <div className="w-1/2 h-full bg-current" />
                <div className="w-1/2 h-full bg-transparent border-l border-current/20" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium leading-none">Planning view</div>
                <div className="text-[10px] font-mono tracking-tight mt-1.5 opacity-80">protocol · materials · resources</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("findings")}
              className={`flex items-center gap-3 px-4 py-2 rounded shadow-sm border transition-all ${
                activeTab === "findings" ? "bg-surface border-border opacity-100 text-foreground" : "bg-transparent border-transparent opacity-60 hover:opacity-100 text-muted-foreground"
              }`}
            >
              <div className="flex w-3.5 h-3.5 border border-current rounded-[3px] overflow-hidden shrink-0 opacity-80">
                <div className="w-1/2 h-full bg-transparent border-r border-current/20" />
                <div className="w-1/2 h-full bg-current" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium leading-none">Findings view</div>
                <div className="text-[10px] font-mono tracking-tight mt-1.5 opacity-80">prior work · reuse · expectations</div>
              </div>
            </button>
          </div>
          <div className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono hidden md:block">
            Execution-ready blueprint
          </div>
        </div>

        <div className="pt-2">
          {activeTab === "planning" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-4">
                <Protocol plan={plan} />
                <Materials plan={plan} />
              </div>
              <div className="lg:col-span-5 space-y-4">
                <Issues plan={plan} onFixAll={() => {}} />
                <Confidence plan={plan} />
                <Timeline plan={plan} />
                <Researchers plan={plan} />
                <Budget plan={plan} />
              </div>
            </div>
          )}
          
          {activeTab === "findings" && (
            <FindingsView plan={plan} />
          )}
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-[1400px] mx-auto px-6">
        <CommandBar onCommand={() => {}} />
      </div>
    </div>
  );
};


