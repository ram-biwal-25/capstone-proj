import type { AssessmentResponse, ChecklistStatus, FarmType } from "./types";

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

// ---------------------------------------------------------------------------
// Species-specific checklist guidance
// These notes are shown as contextual hints in the checklist form but do not
// change the core six items (preserving backward compatibility with stored
// assessment snapshots). They are informational only and do not constitute
// regulatory compliance determinations.
// ---------------------------------------------------------------------------

export type SpeciesGuidance = {
  itemId: string;
  note: string;
};

export const PIG_GUIDANCE: SpeciesGuidance[] = [
  {
    itemId: "visitor_log",
    note: "Pig farms: include details of any visitors who had recent contact with other pigs or pig products.",
  },
  {
    itemId: "entry_controls",
    note: "Pig farms: check that footwear and clothing changes are enforced before entering pig housing.",
  },
  {
    itemId: "animal_health",
    note: "Pig farms: note any signs of respiratory illness, skin lesions, or sudden production changes.",
  },
  {
    itemId: "feed_water",
    note: "Pig farms: confirm swill feeding is prohibited and feed containers are protected from contamination.",
  },
];

export const POULTRY_GUIDANCE: SpeciesGuidance[] = [
  {
    itemId: "visitor_log",
    note: "Poultry farms: record any contact with wild birds or other poultry flocks before entry.",
  },
  {
    itemId: "entry_controls",
    note: "Poultry farms: verify dedicated footwear and clothing are used in every shed.",
  },
  {
    itemId: "animal_health",
    note: "Poultry farms: document any sudden drop in feed/water intake, egg production, or increased mortality.",
  },
  {
    itemId: "mortality_disposal",
    note: "Poultry farms: confirm dead birds are removed and disposed of daily using approved methods.",
  },
];

/** Returns species-specific guidance hints for a given farm type. */
export function getSpeciesGuidance(farmType: FarmType): SpeciesGuidance[] {
  return farmType === "pig" ? PIG_GUIDANCE : POULTRY_GUIDANCE;
}

// ---------------------------------------------------------------------------
// Risk classification
// ---------------------------------------------------------------------------

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type RiskClassification = {
  level: RiskLevel;
  label: string;
  description: string;
  /** Practical corrective actions to show the user. */
  actions: string[];
};

/**
 * Classifies biosecurity risk based on checklist completion and follow-up items.
 *
 * Thresholds are practical guidance for internal self-assessment only.
 * This tool does not make official compliance or regulatory determinations.
 *
 * Rules (applicable items only; not_applicable excluded from denominator):
 * - critical: any applicable items unanswered (incomplete checklist), or ≥ 50% need follow-up
 * - high:     follow-up items ≥ 2
 * - moderate: follow-up items = 1, or completion < 100%
 * - low:      100% done (or all not_applicable)
 */
export function classifyRisk(summary: {
  done: number;
  followUp: number;
  notApplicable: number;
  applicable: number;
  percentage: number | null;
}): RiskClassification {
  // All items were marked not applicable — cannot classify meaningfully.
  if (summary.applicable === 0) {
    return {
      level: "low",
      label: "Not assessed",
      description: "All checklist items were marked as not applicable. No risk can be calculated.",
      actions: ["Review whether these items genuinely do not apply to this farm."],
    };
  }

  const followUpRatio = summary.followUp / summary.applicable;

  if (followUpRatio >= 0.5) {
    return {
      level: "critical",
      label: "Critical",
      description: "Half or more of the applicable checklist items need follow-up. Immediate action is recommended.",
      actions: [
        "Review each follow-up item and assign a responsible person.",
        "Set a date to resolve outstanding actions within 48 hours.",
        "Consider restricting farm access until critical issues are addressed.",
      ],
    };
  }

  if (summary.followUp >= 2) {
    return {
      level: "high",
      label: "High",
      description: "Multiple checklist items need follow-up. Prompt corrective action is recommended.",
      actions: [
        "Address follow-up items before the next farm visit.",
        "Document corrective actions taken for each follow-up item.",
        "Schedule a follow-up assessment within one week.",
      ],
    };
  }

  if (summary.followUp === 1) {
    return {
      level: "moderate",
      label: "Moderate",
      description: "One checklist item needs follow-up. Address it at the earliest opportunity.",
      actions: [
        "Resolve the follow-up item and update the relevant record.",
        "Schedule a follow-up check within two weeks.",
      ],
    };
  }

  // All applicable items are done.
  return {
    level: "low",
    label: "Low",
    description: "All applicable biosecurity checks were completed. Continue routine monitoring.",
    actions: ["Maintain current biosecurity practices.", "Complete the next scheduled assessment on time."],
  };
}

// ---------------------------------------------------------------------------
// Completion summary
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Response validation
// ---------------------------------------------------------------------------

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

