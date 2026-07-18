export const DRIFT_CITATION_THRESHOLD = 3;

export function deriveGovernanceState(record) {
  if (record.authorityState === "Governed decision") return "Governed";
  if (!record.owner) return "Unowned";
  if ((record.citations ?? 0) >= DRIFT_CITATION_THRESHOLD) return "Drift risk";
  if (record.classification && record.classification !== "Unclassified") return "Classified";
  return "Review";
}

export function promotionBlockers(record) {
  const blockers = [];
  if (!record.classification || record.classification === "Unclassified") blockers.push("classification");
  if (!record.owner) blockers.push("accountable owner");
  if (!record.jurisdiction) blockers.push("jurisdiction");
  if ((record.confidence ?? 0) < 70) blockers.push("evidence confidence of at least 70%");
  return blockers;
}

export function canPromote(record) {
  return promotionBlockers(record).length === 0;
}

export function deterministicRecommendation(record) {
  const blockers = promotionBlockers(record);
  if (record.authorityState === "Governed decision") {
    return {
      headline: "Keep this decision governed through evidence review.",
      rationale: "Authority is explicit. Review linked evidence when conditions or jurisdiction change.",
      nextAction: "Schedule evidence review",
      risk: "low",
    };
  }
  if ((record.citations ?? 0) >= DRIFT_CITATION_THRESHOLD) {
    return {
      headline: "Stop implicit reuse and name the governing object.",
      rationale: `${record.citations} downstream citations indicate repetition is becoming assumed authority.`,
      nextAction: blockers.length ? `Resolve ${blockers.join(", ")}` : "Draft governed decision",
      risk: "high",
    };
  }
  return {
    headline: "Keep this evidence observational until it earns inheritance.",
    rationale: blockers.length
      ? `Promotion is blocked by ${blockers.join(", ")}.`
      : "The minimum governance conditions are met; an architect can now decide whether promotion is warranted.",
    nextAction: blockers.length ? `Resolve ${blockers[0]}` : "Review for promotion",
    risk: blockers.length ? "medium" : "low",
  };
}

export function pulse(records) {
  return {
    total: records.length,
    review: records.filter((item) => deriveGovernanceState(item) === "Review").length,
    drift: records.filter((item) => deriveGovernanceState(item) === "Drift risk").length,
    unowned: records.filter((item) => deriveGovernanceState(item) === "Unowned").length,
    governed: records.filter((item) => deriveGovernanceState(item) === "Governed").length,
  };
}
