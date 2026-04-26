import { useState, useEffect } from "react";
import { Plan, Issue } from "@/lib/planData";
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
import { toast } from "@/components/ui/use-toast";
import { buildProtocolText, downloadPlanPdf } from "@/lib/reportExport";
import { API_BASE_URL } from "@/lib/api";

interface Props {
  hypothesis: string;
  onNew: () => void;
  onHub: () => void;
  initialPlan?: Plan | null;
  initialError?: string | null;
}

export const PlanCanvas = ({ hypothesis, onNew, onHub, initialPlan = null, initialError = null }: Props) => {
  const [plan, setPlan] = useState<Plan | null>(initialPlan);
  const [isLoading, setIsLoading] = useState(!initialPlan && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [isCommandBusy, setIsCommandBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"planning" | "findings">("planning");

  const mapApiDataToPlan = (data: any): Plan => {
    const issues = (data.risks || []).map((r: any) => ({
      id: r.id,
      severity: r.severity === "low" ? "suggestion" : r.severity,
      affects: [],
      title: r.title,
      detail: r.detail,
      fix: r.mitigation,
    }));

    return {
      ...data,
      issues,
    };
  };

  const fetchGeneratedPlan = async (query: string, timeoutMs = 90000): Promise<Plan> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new Error("Request timed out while updating the plan. Please try again.");
      }
      throw err;
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!res.ok) {
      let errorMsg = `Server error: ${res.status}`;
      try {
        const text = await res.text();
        try {
          const errData = JSON.parse(text);
          if (errData.detail) {
            errorMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch (_jsonErr) {
          if (text) errorMsg = text;
        }
      } catch (_textErr) {}

      throw new Error(errorMsg);
    }

    const data = await res.json();
    return mapApiDataToPlan(data);
  };

  // Only fetch if we didn't receive a pre-fetched plan (fallback for direct navigation)
  useEffect(() => {
    if (initialPlan || initialError) return;
    const fetchPlan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const generatedPlan = await fetchGeneratedPlan(hypothesis);
        setPlan(generatedPlan);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [hypothesis, initialPlan, initialError]);

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) {
      throw new Error("Clipboard copy failed");
    }
  };

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

  const handleExportReport = async () => {
    try {
      const fileName = await downloadPlanPdf(plan);
      toast({
        title: "Report exported",
        description: `${fileName} downloaded`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err?.message || "Could not export report",
      });
    }
  };

  const handleCopyProtocol = async () => {
    try {
      await copyText(buildProtocolText(plan));
      toast({
        title: "Protocol copied",
        description: "The protocol is now in your clipboard.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: err?.message || "Could not copy protocol",
      });
    }
  };

  const handleApplyFixIssue = (issue: Issue) => {
    setPlan((current) => {
      if (!current) return current;

      const existingIssues = current.issues || [];
      if (!existingIssues.some((i) => i.id === issue.id)) {
        return current;
      }

      return {
        ...current,
        issues: existingIssues.filter((i) => i.id !== issue.id),
        risks: (current.risks || []).filter((risk) => risk.id !== issue.id),
        context: [
          ...(current.context || []),
          {
            source: "user",
            label: `Applied mitigation: ${issue.title}`,
            value: issue.fix,
          },
        ],
      };
    });

    toast({
      title: "Fix applied",
      description: issue.title,
    });
  };

  const handleFixAllIssues = () => {
    const issueCount = (plan.issues || []).length;
    if (issueCount === 0) {
      toast({
        title: "No issues to fix",
        description: "All known issues are already resolved.",
      });
      return;
    }

    setPlan((current) => {
      if (!current) return current;

      const existingIssues = current.issues || [];
      if (existingIssues.length === 0) return current;

      const issueIds = new Set(existingIssues.map((i) => i.id));
      const resolutionContext = existingIssues.map((i) => ({
        source: "user" as const,
        label: `Applied mitigation: ${i.title}`,
        value: i.fix,
      }));

      return {
        ...current,
        issues: [],
        risks: (current.risks || []).filter((risk) => !issueIds.has(risk.id)),
        context: [...(current.context || []), ...resolutionContext],
      };
    });

    toast({
      title: "All fixes applied",
      description: `${issueCount} issue${issueCount === 1 ? "" : "s"} resolved.`,
    });
  };

  const handleDismissIssue = (issue: Issue) => {
    setPlan((current) => {
      if (!current) return current;
      const existingIssues = current.issues || [];
      return {
        ...current,
        issues: existingIssues.filter((i) => i.id !== issue.id),
      };
    });

    toast({
      title: "Issue dismissed",
      description: issue.title,
    });
  };

  const handleExplainIssue = (issue: Issue) => {
    toast({
      title: issue.title,
      description: `${issue.detail} Mitigation: ${issue.fix}`,
    });
  };

  const COMMAND_PROMPTS: Record<string, string> = {
    "Reduce cost": "Reduce total cost while preserving core validity and prioritize cheaper substitutes.",
    "Make faster": "Shorten overall timeline while preserving feasibility and scientific quality.",
    "Improve safety": "Increase safety controls, include hazard mitigation, and minimize risky steps.",
    "Add controls": "Add positive and negative controls and strengthen validation design.",
    "Use past experiment": "Reuse applicable procedures from prior experiments and highlight reused steps.",
    "Optimize based on lab history": "Optimize this plan based on previous lab outcomes and known constraints.",
    "Find best collaborator": "Prioritize assignment to the best-fit available collaborators and justify assignments.",
  };

  const buildRefinementQuery = (baseQuery: string, command: string): string => {
    const normalized = COMMAND_PROMPTS[command] ?? command;
    return [
      `Original hypothesis: ${baseQuery}`,
      `Refinement request: ${normalized}`,
      "Return a fully updated plan with protocol, materials, timeline, budget, risks, and confidence.",
    ].join("\n\n");
  };

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed || !plan || isCommandBusy) return;

    const baseQuery = plan.query || hypothesis;
    const refinedQuery = buildRefinementQuery(baseQuery, trimmed);

    setIsCommandBusy(true);
    try {
      const nextPlan = await fetchGeneratedPlan(refinedQuery);
      setPlan({
        ...nextPlan,
        query: baseQuery,
        context: [
          ...(nextPlan.context || []),
          { source: "user", label: "Steer command", value: trimmed },
        ],
      });

      toast({
        title: "Plan updated",
        description: `Applied: ${trimmed}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Command failed",
        description: err?.message || "Could not apply the command",
      });
    } finally {
      setIsCommandBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      <PlanHeader
        plan={plan}
        onNew={onNew}
        onHub={onHub}
        onExportReport={handleExportReport}
        onCopyProtocol={handleCopyProtocol}
      />

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-4 animate-reveal">
        <HypothesisCard plan={plan} onExportReport={handleExportReport} onCopyProtocol={handleCopyProtocol} />
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7">
                <Protocol plan={plan} />
              </div>
              <div className="lg:col-span-5">
                <Issues
                  plan={plan}
                  onFixAll={handleFixAllIssues}
                  onApplyFix={handleApplyFixIssue}
                  onDismissIssue={handleDismissIssue}
                  onExplainIssue={handleExplainIssue}
                />
              </div>

              <div className="lg:col-span-7">
                <Materials plan={plan} />
              </div>
              <div className="lg:col-span-5">
                <Timeline plan={plan} />
              </div>

              <div className="lg:col-span-7">
                <Researchers plan={plan} />
              </div>
              <div className="lg:col-span-5">
                <Budget plan={plan} />
              </div>

              <div className="lg:col-span-12">
                <Confidence plan={plan} />
              </div>
            </div>
          )}
          
          {activeTab === "findings" && (
            <FindingsView plan={plan} />
          )}
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-[1400px] mx-auto px-6">
        <CommandBar onCommand={handleCommand} busy={isCommandBusy} lastAnswer={plan?.answer} />
      </div>
    </div>
  );
};


