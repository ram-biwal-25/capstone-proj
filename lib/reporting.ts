import { calculateCompletion, classifyRisk, type RiskLevel } from "./checklist";
import type { Assessment } from "./types";

export type FarmAssessmentSummary = {
  farmId: string;
  totalAssessments: number;
  latestAssessment: Assessment | null;
  previousAssessment: Assessment | null;
  latestCompletion: number | null;
  latestRiskLevel: RiskLevel | null;
  latestRiskLabel: string | null;
  totalFollowUps: number;
  trend: "improving" | "stable" | "declining" | "single_record" | "none";
};

/**
 * Summarizes the assessment history for a specific farm.
 * Computes the latest status, open follow-up count, and completion trend over time.
 */
export function summarizeFarmAssessments(
  farmId: string,
  assessments: Assessment[],
): FarmAssessmentSummary {
  const farmAssessments = assessments.filter((a) => a.farmId === farmId);
  const sorted = [...farmAssessments].sort((a, b) => {
    const dComp = b.assessedOn.localeCompare(a.assessedOn);
    if (dComp !== 0) return dComp;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const latest = sorted[0] ?? null;
  const previous = sorted[1] ?? null;

  if (!latest) {
    return {
      farmId,
      totalAssessments: 0,
      latestAssessment: null,
      previousAssessment: null,
      latestCompletion: null,
      latestRiskLevel: null,
      latestRiskLabel: null,
      totalFollowUps: 0,
      trend: "none",
    };
  }

  const latestSummary = calculateCompletion(latest.responses);
  const latestRisk = classifyRisk(latestSummary);

  let trend: "improving" | "stable" | "declining" | "single_record" | "none" = "single_record";
  if (previous) {
    const prevSummary = calculateCompletion(previous.responses);
    const prevScore = prevSummary.percentage ?? 0;
    const currScore = latestSummary.percentage ?? 0;
    if (currScore > prevScore) trend = "improving";
    else if (currScore < prevScore) trend = "declining";
    else trend = "stable";
  }

  return {
    farmId,
    totalAssessments: sorted.length,
    latestAssessment: latest,
    previousAssessment: previous,
    latestCompletion: latestSummary.percentage,
    latestRiskLevel: latestRisk.level,
    latestRiskLabel: latestRisk.label,
    totalFollowUps: latestSummary.followUp,
    trend,
  };
}

export type AssessmentFilters = {
  species?: string;
  risk?: string;
  farmId?: string;
  sort?: string;
};

/**
 * Filters and sorts assessments without modifying original records.
 */
export function filterAndSortAssessments(
  assessments: Assessment[],
  filters: AssessmentFilters,
): Assessment[] {
  let result = [...assessments];

  if (filters.species && (filters.species === "pig" || filters.species === "poultry")) {
    result = result.filter((a) => a.farmType === filters.species);
  }

  if (filters.farmId && filters.farmId !== "all") {
    result = result.filter((a) => a.farmId === filters.farmId);
  }

  if (filters.risk && filters.risk !== "all") {
    result = result.filter((a) => {
      const summary = calculateCompletion(a.responses);
      const risk = classifyRisk(summary);
      return risk.level === filters.risk;
    });
  }

  const sortOrder = filters.sort ?? "date_desc";
  result.sort((a, b) => {
    if (sortOrder === "date_asc") {
      const d = a.assessedOn.localeCompare(b.assessedOn);
      return d !== 0 ? d : a.createdAt.localeCompare(b.createdAt);
    }
    if (sortOrder === "completion_desc") {
      const sa = calculateCompletion(a.responses).percentage ?? -1;
      const sb = calculateCompletion(b.responses).percentage ?? -1;
      return sb - sa;
    }
    if (sortOrder === "completion_asc") {
      const sa = calculateCompletion(a.responses).percentage ?? -1;
      const sb = calculateCompletion(b.responses).percentage ?? -1;
      return sa - sb;
    }
    // Default: date_desc
    const d = b.assessedOn.localeCompare(a.assessedOn);
    return d !== 0 ? d : b.createdAt.localeCompare(a.createdAt);
  });

  return result;
}
