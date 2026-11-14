import assert from "node:assert/strict";
import test from "node:test";
import { calculateCompletion, CHECKLIST_ITEMS, validateResponses } from "../lib/checklist";
import type { AssessmentResponse } from "../lib/types";

// ---------------------------------------------------------------------------
// calculateCompletion
// ---------------------------------------------------------------------------

test("completion: all done returns 100%", () => {
  const responses = CHECKLIST_ITEMS.map(() => ({ status: "done" as const }));
  const summary = calculateCompletion(responses);
  assert.equal(summary.percentage, 100);
  assert.equal(summary.followUp, 0);
  assert.equal(summary.notApplicable, 0);
});

test("completion: all follow_up returns 0%", () => {
  const responses = CHECKLIST_ITEMS.map(() => ({ status: "follow_up" as const }));
  const summary = calculateCompletion(responses);
  assert.equal(summary.percentage, 0);
  assert.equal(summary.done, 0);
});

test("completion: mixed done/follow_up/not_applicable rounds correctly", () => {
  // 3 done, 1 follow_up, 1 not_applicable → percentage = round(3/4 * 100) = 75
  const summary = calculateCompletion([
    { status: "done" },
    { status: "done" },
    { status: "done" },
    { status: "follow_up" },
    { status: "not_applicable" },
  ]);
  assert.equal(summary.done, 3);
  assert.equal(summary.followUp, 1);
  assert.equal(summary.notApplicable, 1);
  assert.equal(summary.applicable, 4);
  assert.equal(summary.percentage, 75);
});

test("completion: all not_applicable gives null percentage", () => {
  const responses = CHECKLIST_ITEMS.map(() => ({ status: "not_applicable" as const }));
  const summary = calculateCompletion(responses);
  assert.equal(summary.applicable, 0);
  assert.equal(summary.percentage, null);
});

test("completion: empty array returns null percentage", () => {
  const summary = calculateCompletion([]);
  assert.equal(summary.percentage, null);
  assert.equal(summary.done, 0);
});

// ---------------------------------------------------------------------------
// validateResponses
// ---------------------------------------------------------------------------

function makeValidPayload(overrides: Partial<AssessmentResponse>[] = []): AssessmentResponse[] {
  return CHECKLIST_ITEMS.map((item, i) => ({
    itemId: item.id,
    label: item.label,
    status: "done" as const,
    note: "",
    ...overrides[i],
  }));
}

test("validateResponses: valid payload returns normalized array", () => {
  const result = validateResponses(makeValidPayload());
  assert.ok(Array.isArray(result));
  assert.equal(result?.length, CHECKLIST_ITEMS.length);
  // labels are taken from CHECKLIST_ITEMS, not from input
  assert.equal(result?.[0].label, CHECKLIST_ITEMS[0].label);
});

test("validateResponses: missing one item returns null", () => {
  const payload = makeValidPayload().slice(1);
  assert.equal(validateResponses(payload), null);
});

test("validateResponses: unknown status returns null", () => {
  const payload = makeValidPayload();
  // @ts-expect-error intentional invalid status for testing
  payload[0].status = "unknown_status";
  assert.equal(validateResponses(payload), null);
});

test("validateResponses: note over 500 chars returns null", () => {
  const payload = makeValidPayload();
  payload[0] = { ...payload[0], note: "x".repeat(501) };
  assert.equal(validateResponses(payload), null);
});

test("validateResponses: note exactly 500 chars is accepted", () => {
  const payload = makeValidPayload();
  payload[0] = { ...payload[0], note: "x".repeat(500) };
  assert.ok(validateResponses(payload) !== null);
});

test("validateResponses: not_applicable is a valid status", () => {
  const payload = makeValidPayload();
  payload[0] = { ...payload[0], status: "not_applicable" };
  assert.ok(validateResponses(payload) !== null);
});

test("validateResponses: duplicate itemIds are rejected (Map collapses them)", () => {
  const payload = makeValidPayload();
  // Replace second item with a duplicate of first
  payload[1] = { ...payload[0] };
  assert.equal(validateResponses(payload), null);
});

test("validateResponses: non-array input returns null", () => {
  assert.equal(validateResponses(null), null);
  assert.equal(validateResponses("string"), null);
  assert.equal(validateResponses(42), null);
  assert.equal(validateResponses({}), null);
});
