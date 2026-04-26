import { Plan } from "@/lib/planData";
import { knowledgeBase } from "@/lib/labData";
import { useLabData } from "@/lib/useLabData";
import { Globe, BookOpen, FlaskConical, Box } from "lucide-react";

// Replaces ContextUsed — shows the four contextual layers explicitly.
export const ContextLayers = ({ plan }: { plan: Plan }) => {
  const { equipment, pastExperiments, isLoading } = useLabData();
  
  const labCtx = plan.context.filter((c) => c.source === "lab-profile");
  const inferred = plan.context.filter((c) => c.source === "inferred" || c.source === "user");
  const litCtx = plan.context.filter((c) => c.source === "literature");
  
  // Similarity computation (fallback to title matching if similarity field is missing in DB)
  const similarPast = pastExperiments.filter((e) => 
    (e.similarity ?? 0) > 0.6 || 
    plan.query.toLowerCase().split(' ').some(word => e.title.toLowerCase().includes(word))
  );

  const availEquip = equipment.filter((e) => e.required && e.available).length;
  const totalReq = equipment.filter((e) => e.required).length;

  if (isLoading) {
    return (
      <div className="panel animate-pulse">
        <div className="panel-header">
          <span className="panel-title">context used · 4-layer fusion</span>
        </div>
        <div className="p-12 flex justify-center">
          <span className="label-num italic">Synthesizing context layers...</span>
        </div>
      </div>
    );
  }

  const layers = [
    {
      code: "WORLD",
      icon: <Globe className="w-3.5 h-3.5" />,
      title: "Lab Context",
      colorCls: "text-info",
      items: [
        ...labCtx.map((c) => ({ k: c.label, v: c.value })),
        { k: "Equipment available", v: `${availEquip} / ${totalReq} required` },
      ],
    },
    {
      code: "KNOWLEDGE",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      title: "Knowledge Base",
      colorCls: "text-novel",
      items: [
        ...knowledgeBase.map((k) => ({ k: k.type, v: k.title })),
        ...litCtx.map((c) => ({ k: c.label, v: c.value })),
      ],
    },
    {
      code: "STATE",
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      title: "Experiment State",
      colorCls: "text-success",
      items: similarPast.length
        ? similarPast.map((e) => ({ k: `${e.id} · ${Math.round((e.similarity ?? 0) * 100)}%`, v: e.title }))
        : [{ k: "—", v: "No similar past experiments" }],
    },
    {
      code: "CONTEXT",
      icon: <Box className="w-3.5 h-3.5" />,
      title: "Active Resource Snapshot",
      colorCls: "text-accent",
      items: [
        ...inferred.map((c) => ({ k: c.label, v: c.value })),
        { k: "Snapshot taken", v: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
      ],
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">context used · 4-layer fusion</span>
        <span className="label-num">this plan is not generic</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {layers.map((l) => (
          <div key={l.code} className="p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="leading-none">{l.icon}</span>
              <span className={`label-num font-bold ${l.colorCls}`}>{l.code}</span>
            </div>
            <div className="text-[11px] font-medium text-foreground mb-2">{l.title}</div>
            <ul className="space-y-1.5">
              {l.items.slice(0, 5).map((it, i) => (
                <li key={i} className="text-[11px] leading-snug">
                  <div className="label-num">{it.k}</div>
                  <div className="text-foreground">{it.v}</div>
                </li>
              ))}
              {l.items.length > 5 && <li className="label-num">+{l.items.length - 5} more</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
