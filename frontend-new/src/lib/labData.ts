// Lab Intelligence — WORLD, KNOWLEDGE, STATE layers
// Past experiments, researchers, equipment inventory, knowledge base.

export interface PastExperiment {
  id: string;
  title: string;
  objective: string;
  date: string;
  lead: string;
  status: "completed" | "inconclusive" | "failed" | "in-progress";
  outcome: string;
  learnings: string[];
  tags: string[];
  similarity?: number; // computed vs. current plan
  reusableSteps?: string[]; // step ids from current plan that match this experiment
  contradicts?: boolean;
}

export interface Researcher {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  pastWork: string;
  availability: "available" | "busy" | "limited";
  hoursThisWeek: number;
  matchScore?: number; // computed
  matchReason?: string;
}

export interface Equipment {
  name: string;
  category: "imaging" | "molecular" | "cell-culture" | "analytical" | "general";
  available: boolean;
  bookedUntil?: string;
  location: string;
  required?: boolean; // required by current plan
}

export interface KnowledgeEntry {
  id: string;
  type: "protocol" | "guideline" | "method";
  title: string;
  source: string;
  appliedTo: string[]; // step ids
}

// ===== KNOWLEDGE — Protocols / guidelines applied =====
export const knowledgeBase: KnowledgeEntry[] = [
  { id: "k1", type: "guideline", title: "Klionsky 2021 · Autophagy assay guidelines (4th ed.)", source: "Autophagy 17(1):1–382", appliedTo: ["s3", "s5", "s6"] },
  { id: "k2", type: "protocol", title: "Lab SOP-014 · siRNA transfection in adherent hepatic lines", source: "Internal · authored Mehta 2025", appliedTo: ["s1", "s2"] },
  { id: "k3", type: "method", title: "Densitometry normalization (LC3-II / GAPDH)", source: "ImageJ Auto-Densitometry plugin", appliedTo: ["s7"] },
  { id: "k4", type: "protocol", title: "BCA total-protein quantification", source: "Thermo 23227 manual", appliedTo: ["s4"] },
];

// ===== Hub assistant — seed messages =====
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const seedAssistantMessage: ChatMessage = {
  role: "assistant",
  content:
    "I'm your lab mentor. Ask me about past experiments, suggest research directions, or compare a new hypothesis against the lab's history. Try: *\"What did we learn from the TFEB starvation work?\"* or *\"What hasn't been tried yet in autophagy?\"*",
};

// Compute researcher match for an experiment hypothesis (very simple keyword overlap)
export function scoreResearchers(hypothesis: string, researchersList: Researcher[]): Researcher[] {
  const h = hypothesis.toLowerCase();
  return researchersList
    .map((r) => {
      const hits = r.expertise.filter((e) => h.includes(e.toLowerCase().split(" ")[0]));
      // baseline + keyword bonus + availability nudge
      const base = 35 + hits.length * 18;
      const avail = r.availability === "available" ? 8 : r.availability === "limited" ? 2 : -5;
      const score = Math.min(98, base + avail + (r.expertise.includes("autophagy") || r.expertise.includes("HepG2") ? 12 : 0));
      const reason =
        hits.length > 0
          ? `Matches ${hits.slice(0, 3).join(", ")}`
          : r.availability === "available"
          ? "Adjacent expertise; available bandwidth"
          : "Limited overlap with hypothesis";
      return { ...r, matchScore: score, matchReason: reason };
    })
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}
