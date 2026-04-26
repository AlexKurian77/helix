import { useState } from "react";
import { Hub } from "@/components/Hub";
import { Landing } from "@/components/Landing";
import { StagedReasoning } from "@/components/StagedReasoning";
import { PlanCanvas } from "@/components/PlanCanvas";

type Stage = "hub" | "landing" | "generating" | "plan";

const Index = () => {
  const [stage, setStage] = useState<Stage>("hub");
  const [hypothesis, setHypothesis] = useState("");

  if (stage === "hub") {
    return <Hub onStart={() => setStage("landing")} />;
  }
  if (stage === "landing") {
    return <Landing onSubmit={(h) => { setHypothesis(h); setStage("generating"); }} onHub={() => setStage("hub")} />;
  }
  if (stage === "generating") {
    return <StagedReasoning onComplete={() => setStage("plan")} />;
  }
  return <PlanCanvas hypothesis={hypothesis} onNew={() => setStage("landing")} onHub={() => setStage("hub")} />;
};

export default Index;
