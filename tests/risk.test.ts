import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRisk,
  getSpeciesGuidance,
  PIG_GUIDANCE,
  POULTRY_GUIDANCE,
  CHECKLIST_ITEMS,
} from "../lib/checklist";

// ---------------------------------------------------------------------------
// classifyRisk
// ---------------------------------------------------------------------------

test("classifyRisk: all done → low risk", () => {
  const result = classifyRisk({ done: 6, followUp: 0, notApplicable: 0, applicable: 6, percentage: 100 });
  assert.equal(result.level, "low");
});

test("classifyRisk: one follow-up → moderate risk", () => {
  const result = classifyRisk({ done: 5, followUp: 1, notApplicable: 0, applicable: 6, percentage: 83 });
  assert.equal(result.level, "moderate");
});

test("classifyRisk: two follow-ups → high risk", () => {
  const result = classifyRisk({ done: 4, followUp: 2, notApplicable: 0, applicable: 6, percentage: 67 });
  assert.equal(result.level, "high");
});

test("classifyRisk: ≥50% follow-up ratio → critical risk", () => {
  // 3 of 6 applicable → 50% follow-up
  const result = classifyRisk({ done: 3, followUp: 3, notApplicable: 0, applicable: 6, percentage: 50 });
  assert.equal(result.level, "critical");
});

test("classifyRisk: all not_applicable → not assessed (low)", () => {
  const result = classifyRisk({ done: 0, followUp: 0, notApplicable: 6, applicable: 0, percentage: null });
  assert.equal(result.level, "low");
  assert.ok(result.label.includes("Not assessed") || result.label === "Not assessed");
});

test("classifyRisk: returns at least one corrective action", () => {
  const levels = [
    { done: 6, followUp: 0, notApplicable: 0, applicable: 6, percentage: 100 },
    { done: 5, followUp: 1, notApplicable: 0, applicable: 6, percentage: 83 },
    { done: 4, followUp: 2, notApplicable: 0, applicable: 6, percentage: 67 },
    { done: 2, followUp: 4, notApplicable: 0, applicable: 6, percentage: 33 },
  ];
  for (const summary of levels) {
    const r = classifyRisk(summary);
    assert.ok(r.actions.length > 0, `${r.level} risk should include corrective actions`);
    assert.ok(r.description.length > 0, `${r.level} risk should include a description`);
  }
});

// ---------------------------------------------------------------------------
// getSpeciesGuidance
// ---------------------------------------------------------------------------

test("getSpeciesGuidance: returns pig guidance for pig farms", () => {
  const guidance = getSpeciesGuidance("pig");
  assert.deepEqual(guidance, PIG_GUIDANCE);
  assert.ok(guidance.length > 0);
});

test("getSpeciesGuidance: returns poultry guidance for poultry farms", () => {
  const guidance = getSpeciesGuidance("poultry");
  assert.deepEqual(guidance, POULTRY_GUIDANCE);
  assert.ok(guidance.length > 0);
});

test("getSpeciesGuidance: pig and poultry guidance differ", () => {
  const pig = getSpeciesGuidance("pig");
  const poultry = getSpeciesGuidance("poultry");
  assert.notDeepEqual(pig, poultry);
});

test("getSpeciesGuidance: guidance items reference valid checklist item IDs", () => {
  const validIds = new Set<string>(CHECKLIST_ITEMS.map((i) => i.id));

  for (const { itemId } of [...PIG_GUIDANCE, ...POULTRY_GUIDANCE]) {
    assert.ok(validIds.has(itemId), `guidance itemId "${itemId}" must match a checklist item`);
  }
});
