import assert from "node:assert/strict";
import test from "node:test";
import { calculateCompletion, CHECKLIST_ITEMS, validateResponses } from "../lib/checklist";

test("checklist completion excludes not applicable responses", () => {
  const summary = calculateCompletion([
    { status: "done" },
    { status: "done" },
    { status: "done" },
    { status: "follow_up" },
    { status: "not_applicable" },
  ]);

  assert.deepEqual(summary, {
    done: 3,
    followUp: 1,
    notApplicable: 1,
    applicable: 4,
    percentage: 75,
  });
});

test("checklist completion is not calculated when every response is not applicable", () => {
  const summary = calculateCompletion(
    CHECKLIST_ITEMS.map(() => ({ status: "not_applicable" as const })),
  );

  assert.equal(summary.applicable, 0);
  assert.equal(summary.percentage, null);
});

test("response validation requires one valid answer for every checklist item", () => {
  const valid = CHECKLIST_ITEMS.map((item) => ({
    itemId: item.id,
    status: "done",
    note: item.id === "visitor_log" ? "Checked the visitor book." : "",
  }));

  const normalized = validateResponses(valid);
  assert.equal(normalized?.length, CHECKLIST_ITEMS.length);
  assert.equal(normalized?.[0].label, CHECKLIST_ITEMS[0].label);
  assert.equal(validateResponses(valid.slice(1)), null);
  assert.equal(validateResponses(valid.map((item, index) => index === 0 ? { ...item, status: "unknown" } : item)), null);
});
