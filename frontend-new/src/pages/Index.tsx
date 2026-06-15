import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Hub } from "@/components/Hub";
import { Marketing } from "@/components/Marketing";
import { Landing } from "@/components/Landing";
import { StagedReasoning } from "@/components/StagedReasoning";
import { PlanCanvas } from "@/components/PlanCanvas";
import { Plan } from "@/lib/planData";
import { Profile } from "@/components/Profile";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";

type Stage = "marketing" | "hub" | "landing" | "generating" | "plan" | "profile";

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
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // stage state is now partially driven by URL
  const [internalStage, setInternalStage] = useState<Stage>("marketing");
  const [hypothesis, setHypothesis] = useState("");
  const [refinedHypothesis, setRefinedHypothesis] = useState("");
  const [contextProtocol, setContextProtocol] = useState("");
  const [prefetchedPlan, setPrefetchedPlan] = useState<Plan | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Sync internal stage with URL
  useEffect(() => {
    if (pathname === "/") {
      setInternalStage("marketing");
    } else if (pathname === "/hub") {
      setInternalStage("hub");
    } else if (pathname === "/new") {
      // Only force 'landing' if we aren't currently in the middle of generating or showing a plan
      setInternalStage((current) => (current === "generating" ? "generating" : "landing"));
    } else if (pathname === "/plan") {
      if (!prefetchedPlan && !fetchError) {
        navigate("/hub");
      } else {
        setInternalStage("plan");
      }
    } else if (pathname === "/profile") {
      setInternalStage("profile");
    }
  }, [pathname, prefetchedPlan, fetchError, navigate]);

  const startGeneration = useCallback((h: string) => {
    setHypothesis(h);
    setRefinedHypothesis("");
    setContextProtocol("");
    setPrefetchedPlan(null);
    setFetchError(null);
    setDataReady(false);
    setInternalStage("generating");

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = window.setTimeout(() => controller.abort(), 90000);

    const executeGeneration = async () => {
      try {
        // Step 1: Generate the plan (Refinement now happens manually on Landing page)
        const genRes = await fetchWithAuth(`${API_BASE_URL}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: h }),
          signal: controller.signal,
        });

        if (!genRes.ok) {
          let errorMsg = `Server error: ${genRes.status}`;
          try {
            const text = await genRes.text();
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

        const data = await genRes.json();
        setPrefetchedPlan(mapApiDataToPlan(data));
        setDataReady(true);
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setFetchError("Request timed out. Please try again.");
        } else {
          setFetchError(err?.message || "An error occurred");
        }
        setDataReady(true);
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    executeGeneration();
  }, [navigate]);

  const handleRefine = async (h: string): Promise<string> => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis: h }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.refined;
      }
    } catch (e) {
      console.error("Refinement failed", e);
    }
    return h;
  };

  const loadFullReport = async (experimentId: string, hypothesisTitle: string) => {
    setHypothesis(hypothesisTitle);
    setPrefetchedPlan(null);
    setFetchError(null);
    setDataReady(false);
    setInternalStage("generating");
    
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/lab/experiments/${experimentId}/plan`);
      if (!res.ok) {
        throw new Error(`Failed to load report: ${res.status}`);
      }
      const data = await res.json();
      setPrefetchedPlan(mapApiDataToPlan(data));
      setDataReady(true);
    } catch (err: any) {
      setFetchError(err?.message || "Could not load report");
      setDataReady(true);
    }
  };

  if (internalStage === "marketing") {
    return <Marketing onEnter={() => navigate("/hub")} />;
  }
  if (internalStage === "hub") {
    return (
      <Hub 
        onStart={() => {
          setHypothesis("");
          navigate("/new");
        }} 
        onReuse={(e) => {
          setHypothesis(e.title || e.hypothesis);
          navigate("/new");
        }}
        onViewReport={(e) => {
          loadFullReport(e.id, e.title || e.hypothesis);
        }}
        onProfile={() => navigate("/profile")}
      />
    );
  }
  if (internalStage === "landing") {
    return (
      <Landing
        onSubmit={(h) => startGeneration(h)}
        onRefine={handleRefine}
        onHub={() => navigate("/hub")}
        onProfile={() => navigate("/profile")}
        initialHypothesis={hypothesis}
      />
    );
  }
  if (internalStage === "generating") {
    return (
      <StagedReasoning
        dataReady={dataReady}
        error={fetchError}
        onComplete={() => navigate("/plan")}
      />
    );
  }
  if (internalStage === "profile") {
    return <Profile onHub={() => navigate("/hub")} />;
  }
  return (
    <PlanCanvas
      hypothesis={hypothesis}
      initialPlan={prefetchedPlan}
      initialError={fetchError}
      onNew={() => navigate("/new")}
      onHub={() => navigate("/hub")}
      onProfile={() => navigate("/profile")}
    />
  );
};

export default Index;
