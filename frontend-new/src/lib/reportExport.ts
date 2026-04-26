import { Plan } from "@/lib/planData";

const safePlanId = (plan: Plan): string => `PLN-${plan.plan_id ?? "NEW"}`;

const formatMoney = (value: number): string => `$${value.toLocaleString()}`;

export const buildProtocolText = (plan: Plan): string => {
  const steps = plan.experiment_plan.protocol ?? [];

  return [
    `Protocol for ${safePlanId(plan)}`,
    `Hypothesis: ${plan.query}`,
    "",
    ...steps.flatMap((step) => [
      `Step ${step.step_number}: ${step.title}`,
      `Duration: ${step.duration}`,
      step.description,
      ...(step.notes ? [`Notes: ${step.notes}`] : []),
      "",
    ]),
  ].join("\n");
};

export const buildPlanReport = (plan: Plan): string => {
  const experiment = plan.experiment_plan;
  const literature = plan.literature_qc;

  const protocolSection = (experiment.protocol ?? [])
    .map((step) => {
      const notesLine = step.notes ? `\n  Notes: ${step.notes}` : "";
      return `- Step ${step.step_number}: ${step.title} (${step.duration})\n  ${step.description}${notesLine}`;
    })
    .join("\n");

  const materialsSection = (experiment.materials ?? [])
    .map((item) => `- ${item.name}: ${item.quantity} ${item.unit} (${formatMoney(item.estimated_cost)})`)
    .join("\n");

  const budgetSection = (experiment.budget ?? [])
    .map((item) => `- ${item.category}: ${item.item} (${formatMoney(item.cost)})`)
    .join("\n");

  const timelineSection = (experiment.timeline ?? [])
    .map((phase) => `- ${phase.phase}: ${phase.duration} - ${phase.description}`)
    .join("\n");

  const risksSection = (plan.risks ?? [])
    .map((risk) => `- [${risk.severity}] ${risk.title}: ${risk.detail} | Mitigation: ${risk.mitigation}`)
    .join("\n");

  const refsSection = (literature.references ?? [])
    .map((ref, index) => `- ${index + 1}. ${ref.title} (${ref.type}, relevance ${ref.relevance_score})${ref.url ? ` - ${ref.url}` : ""}`)
    .join("\n");

  return [
    "# Experiment Plan Report",
    "",
    `Plan ID: ${safePlanId(plan)}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "## Hypothesis",
    plan.query,
    "",
    "## Objective",
    experiment.objective,
    "",
    "## Validation Method",
    experiment.validation_method,
    "",
    "## Protocol",
    protocolSection || "- No protocol steps available",
    "",
    "## Materials",
    materialsSection || "- No materials listed",
    "",
    "## Budget",
    budgetSection || "- No budget items listed",
    `Total Budget: ${formatMoney(experiment.total_budget)}`,
    "",
    "## Timeline",
    timelineSection || "- No timeline phases listed",
    `Total Duration: ${experiment.total_duration}`,
    "",
    "## Literature QC",
    `${literature.status}: ${literature.message}`,
    "",
    "## References",
    refsSection || "- No references available",
    "",
    "## Risks",
    risksSection || "- No risks identified",
    "",
  ].join("\n");
};

export const downloadPlanPdf = async (plan: Plan): Promise<string> => {
  const { jsPDF } = await import("jspdf");
  const fileName = `${safePlanId(plan).toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  const generatedAt = new Date().toLocaleString();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 44;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxTextWidth = pageWidth - margin * 2;
  const lineHeight = 14;
  const sectionGap = 18;
  const bottomBoundary = pageHeight - margin - 20;
  let y = 118;

  const startFollowupPage = () => {
    doc.addPage();
    doc.setDrawColor(225, 230, 236);
    doc.line(margin, 32, pageWidth - margin, 32);
    doc.setTextColor(90, 100, 115);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${safePlanId(plan)} • Experiment Plan`, margin, 22);
    y = 52;
  };

  const ensureSpace = (needed = lineHeight * 2) => {
    if (y + needed > bottomBoundary) {
      startFollowupPage();
    }
  };

  const addParagraph = (text: string, options?: { color?: [number, number, number]; indent?: number; spacingAfter?: number }) => {
    const indent = options?.indent ?? 0;
    const color = options?.color ?? [33, 37, 41];
    const spacingAfter = options?.spacingAfter ?? 8;
    const content = (text || "").trim();
    if (!content) return;

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    const lines = doc.splitTextToSize(content, maxTextWidth - indent);
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }
    y += spacingAfter;
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(30);
    doc.setFillColor(244, 247, 251);
    doc.roundedRect(margin, y - 14, maxTextWidth, 22, 4, 4, "F");
    doc.setTextColor(23, 38, 61);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text(title, margin + 8, y);
    y += sectionGap;
  };

  const addBulletList = (items: string[]) => {
    if (items.length === 0) {
      addParagraph("No items available.", { color: [108, 117, 125] });
      return;
    }

    for (const item of items) {
      const lines = doc.splitTextToSize(item, maxTextWidth - 16);
      if (lines.length === 0) continue;

      ensureSpace(lines.length * lineHeight + 2);
      doc.setTextColor(46, 66, 90);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("•", margin + 1, y);

      doc.setTextColor(33, 37, 41);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text(lines[0], margin + 12, y);
      y += lineHeight;

      for (let i = 1; i < lines.length; i += 1) {
        ensureSpace(lineHeight);
        doc.text(lines[i], margin + 12, y);
        y += lineHeight;
      }
      y += 3;
    }
    y += 5;
  };

  doc.setFillColor(17, 30, 48);
  doc.rect(0, 0, pageWidth, 88, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Experiment Plan Report", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`${safePlanId(plan)} • ${generatedAt}`, margin, 58);

  addSectionTitle("Hypothesis");
  addParagraph(plan.query, { spacingAfter: 12 });

  addSectionTitle("Objective");
  addParagraph(plan.experiment_plan.objective, { spacingAfter: 12 });

  addSectionTitle("Plan Snapshot");
  addBulletList([
    `Validation method: ${plan.experiment_plan.validation_method}`,
    `Total duration: ${plan.experiment_plan.total_duration}`,
    `Total budget: ${formatMoney(plan.experiment_plan.total_budget)}`,
  ]);

  addSectionTitle("Protocol");
  if ((plan.experiment_plan.protocol ?? []).length === 0) {
    addParagraph("No protocol steps available.", { color: [108, 117, 125] });
  } else {
    for (const step of plan.experiment_plan.protocol) {
      ensureSpace(30);
      doc.setTextColor(21, 31, 45);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Step ${step.step_number}: ${step.title}`, margin, y);
      y += lineHeight;
      addParagraph(`Duration: ${step.duration}`, { color: [86, 99, 114], spacingAfter: 5 });
      addParagraph(step.description, { spacingAfter: 5 });
      if (step.notes) {
        addParagraph(`Notes: ${step.notes}`, { color: [93, 74, 23], spacingAfter: 8 });
      }
      y += 3;
    }
  }

  addSectionTitle("Materials");
  addBulletList(
    (plan.experiment_plan.materials ?? []).map(
      (item) => `${item.name} — ${item.quantity} ${item.unit} (${formatMoney(item.estimated_cost)})`,
    ),
  );

  addSectionTitle("Budget");
  addBulletList(
    (plan.experiment_plan.budget ?? []).map(
      (item) => `${item.category}: ${item.item} (${formatMoney(item.cost)})`,
    ),
  );

  addSectionTitle("Timeline");
  addBulletList(
    (plan.experiment_plan.timeline ?? []).map(
      (phase) => `${phase.phase} (${phase.duration}) — ${phase.description}`,
    ),
  );

  addSectionTitle("Literature QC");
  addParagraph(`Status: ${plan.literature_qc.status}`);
  addParagraph(plan.literature_qc.message, { spacingAfter: 10 });

  addSectionTitle("References");
  addBulletList(
    (plan.literature_qc.references ?? []).map(
      (ref, index) => `${index + 1}. ${ref.title}${ref.url ? ` — ${ref.url}` : ""}`,
    ),
  );

  addSectionTitle("Risks and Mitigations");
  addBulletList(
    (plan.risks ?? []).map(
      (risk) => `[${risk.severity.toUpperCase()}] ${risk.title}: ${risk.detail} | Mitigation: ${risk.mitigation}`,
    ),
  );

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(128, 136, 146);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 12, { align: "right" });
  }

  doc.save(fileName);
  return fileName;
};