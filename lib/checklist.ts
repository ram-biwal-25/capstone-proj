import type { AssessmentResponse, ChecklistStatus } from "./types";

export const CHECKLIST_ITEMS = [
  {
    id: "visitor_log",
    label: "Visitor log is up to date",
    help: "Check that recent visitors, dates, and reasons for entry were recorded.",
  },
  {
    id: "equipment_cleaning",
    label: "Equipment cleaning was recorded",
    help: "Confirm shared tools and equipment have a recent cleaning or disinfection record.",
  },
  {
    id: "entry_controls",
    label: "Farm entry controls were checked",
    help: "Review signs, restricted areas, footwear, and hand-cleaning arrangements.",
  },
  {
    id: "animal_health",
    label: "Animal health observations were documented",
    help: "Confirm unusual illness, behaviour, or production changes were recorded.",
  },
  {
    id: "feed_water",
    label: "Feed and water checks were recorded",
    help: "Review storage protection and the latest feed and water quality checks.",
  },
  {
    id: "mortality_disposal",
    label: "Mortality and disposal records are current",
    help: "Confirm deaths and approved disposal actions were documented.",
  },
] as const;

export const STATUS_LABELS: Record<ChecklistStatus, string> = {
  done: "Done",
  follow_up: "Needs follow-up",
  not_applicable: "Not applicable",
};

export type CompletionSummary = {
  done: number;
  followUp: number;
  notApplicable: number;
  applicable: number;
  percentage: number | null;
};

export function calculateCompletion(responses: Pick<AssessmentResponse, "status">[]): CompletionSummary {
  const done = responses.filter((response) => response.status === "done").length;
  const followUp = responses.filter((response) => response.status === "follow_up").length;
  const notApplicable = responses.filter(
    (response) => response.status === "not_applicable",
  ).length;
  const applicable = done + followUp;

  return {
    done,
    followUp,
    notApplicable,
    applicable,
    percentage: applicable === 0 ? null : Math.round((done / applicable) * 100),
  };
}

export function validateResponses(value: unknown): AssessmentResponse[] | null {
  if (!Array.isArray(value) || value.length !== CHECKLIST_ITEMS.length) return null;

  const allowedStatuses = new Set<ChecklistStatus>(["done", "follow_up", "not_applicable"]);
  const suppliedById = new Map(
    value.map((response) => [
      typeof response === "object" && response !== null && "itemId" in response
        ? String(response.itemId)
        : "",
      response,
    ]),
  );

  if (suppliedById.size !== CHECKLIST_ITEMS.length) return null;

  const normalized: AssessmentResponse[] = [];
  for (const item of CHECKLIST_ITEMS) {
    const response = suppliedById.get(item.id);
    if (typeof response !== "object" || response === null || !("status" in response)) return null;

    const status = String(response.status) as ChecklistStatus;
    const note = "note" in response ? String(response.note).trim() : "";
    if (!allowedStatuses.has(status) || note.length > 500) return null;

    normalized.push({ itemId: item.id, label: item.label, status, note });
  }

  return normalized;
}
