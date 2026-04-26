import { useState, useRef, useCallback } from "react";
import { Hub } from "@/components/Hub";
import { Landing } from "@/components/Landing";
import { StagedReasoning } from "@/components/StagedReasoning";
import { PlanCanvas } from "@/components/PlanCanvas";
import { Plan } from "@/lib/planData";
import { API_BASE_URL } from "@/lib/api";

type Stage = "hub" | "landing" | "generating" | "plan";

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

const Index = () => {
  const [stage, setStage] = useState<Stage>("hub");
  const [hypothesis, setHypothesis] = useState("");
  const [prefetchedPlan, setPrefetchedPlan] = useState<Plan | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback((h: string) => {
    setHypothesis(h);
    setPrefetchedPlan(null);
    setFetchError(null);
    setDataReady(false);
    setStage("generating");

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = window.setTimeout(() => controller.abort(), 90000);

    fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: h }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          let errorMsg = `Server error: ${res.status}`;
          try {
            const text = await res.text();
            try {
              const errData = JSON.parse(text);
              if (errData.detail) {
                errorMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
              }
            } catch (_) {
              if (text) errorMsg = text;
            }
          } catch (_) {}
          throw new Error(errorMsg);
        }
        return res.json();
      })
      .then((data) => {
        setPrefetchedPlan(mapApiDataToPlan(data));
        setDataReady(true);
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          setFetchError("Request timed out. Please try again.");
        } else {
          setFetchError(err?.message || "An error occurred");
        }
        setDataReady(true);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });
  }, []);

  if (stage === "hub") {
    return <Hub onStart={() => setStage("landing")} />;
  }
  if (stage === "landing") {
    return <Landing onSubmit={(h) => startGeneration(h)} onHub={() => setStage("hub")} />;
  }
  if (stage === "generating") {
    return (
      <StagedReasoning
        dataReady={dataReady}
        error={fetchError}
        onComplete={() => setStage("plan")}
      />
    );
  }
  return (
    <PlanCanvas
      hypothesis={hypothesis}
      initialPlan={prefetchedPlan}
      initialError={fetchError}
      onNew={() => setStage("landing")}
      onHub={() => setStage("hub")}
    />
  );
};

export default Index;
