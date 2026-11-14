import assert from "node:assert/strict";
import test from "node:test";
import { filterAndSortAssessments, summarizeFarmAssessments } from "../lib/reporting";
import type { Assessment } from "../lib/types";

function createMockAssessment(overrides: Partial<Assessment>): Assessment {
  return {
    id: "test-id",
    farmId: "farm-1",
    farmName: "Test Farm",
    farmType: "pig",
    assessedOn: "2026-01-01",
    responses: [
      { itemId: "visitor_log", label: "Visitor log", status: "done", note: "" },
      { itemId: "equipment_cleaning", label: "Equipment", status: "done", note: "" },
      { itemId: "entry_controls", label: "Controls", status: "done", note: "" },
      { itemId: "animal_health", label: "Health", status: "done", note: "" },
      { itemId: "feed_water", label: "Feed", status: "done", note: "" },
      { itemId: "mortality_disposal", label: "Mortality", status: "done", note: "" },
    ],
    createdAt: "2026-01-01T10:00:00Z",
    createdBy: "Tester",
    ...overrides,
  };
}

test("summarizeFarmAssessments: handles empty assessment history", () => {
  const summary = summarizeFarmAssessments("farm-empty", []);
  assert.equal(summary.totalAssessments, 0);
  assert.equal(summary.latestAssessment, null);
  assert.equal(summary.trend, "none");
});

test("summarizeFarmAssessments: computes single assessment summary", () => {
  const a1 = createMockAssessment({ id: "a1", farmId: "farm-1" });
  const summary = summarizeFarmAssessments("farm-1", [a1]);
  assert.equal(summary.totalAssessments, 1);
  assert.equal(summary.latestCompletion, 100);
  assert.equal(summary.latestRiskLevel, "low");
  assert.equal(summary.trend, "single_record");
});

test("summarizeFarmAssessments: detects improving trend", () => {
  const aOlder = createMockAssessment({
    id: "a-old",
    farmId: "farm-1",
    assessedOn: "2026-01-01",
    responses: [
      { itemId: "visitor_log", label: "Visitor log", status: "follow_up", note: "" },
      { itemId: "equipment_cleaning", label: "Equipment", status: "done", note: "" },
      { itemId: "entry_controls", label: "Controls", status: "done", note: "" },
      { itemId: "animal_health", label: "Health", status: "done", note: "" },
      { itemId: "feed_water", label: "Feed", status: "done", note: "" },
      { itemId: "mortality_disposal", label: "Mortality", status: "done", note: "" },
    ],
  });
  const aNewer = createMockAssessment({
    id: "a-new",
    farmId: "farm-1",
    assessedOn: "2026-02-01",
    responses: [
      { itemId: "visitor_log", label: "Visitor log", status: "done", note: "" },
      { itemId: "equipment_cleaning", label: "Equipment", status: "done", note: "" },
      { itemId: "entry_controls", label: "Controls", status: "done", note: "" },
      { itemId: "animal_health", label: "Health", status: "done", note: "" },
      { itemId: "feed_water", label: "Feed", status: "done", note: "" },
      { itemId: "mortality_disposal", label: "Mortality", status: "done", note: "" },
    ],
  });

  const summary = summarizeFarmAssessments("farm-1", [aOlder, aNewer]);
  assert.equal(summary.totalAssessments, 2);
  assert.equal(summary.latestAssessment?.id, "a-new");
  assert.equal(summary.trend, "improving");
});

test("filterAndSortAssessments: filters by species", () => {
  const aPig = createMockAssessment({ id: "p1", farmType: "pig" });
  const aPoultry = createMockAssessment({ id: "h1", farmType: "poultry" });

  const pigs = filterAndSortAssessments([aPig, aPoultry], { species: "pig" });
  assert.equal(pigs.length, 1);
  assert.equal(pigs[0].id, "p1");

  const poultries = filterAndSortAssessments([aPig, aPoultry], { species: "poultry" });
  assert.equal(poultries.length, 1);
  assert.equal(poultries[0].id, "h1");
});

test("filterAndSortAssessments: filters by risk level", () => {
  const aLow = createMockAssessment({ id: "low-1" });
  const aHigh = createMockAssessment({
    id: "high-1",
    responses: [
      { itemId: "visitor_log", label: "Visitor log", status: "follow_up", note: "" },
      { itemId: "equipment_cleaning", label: "Equipment", status: "follow_up", note: "" },
      { itemId: "entry_controls", label: "Controls", status: "done", note: "" },
      { itemId: "animal_health", label: "Health", status: "done", note: "" },
      { itemId: "feed_water", label: "Feed", status: "done", note: "" },
      { itemId: "mortality_disposal", label: "Mortality", status: "done", note: "" },
    ],
  });

  const lowResults = filterAndSortAssessments([aLow, aHigh], { risk: "low" });
  assert.equal(lowResults.length, 1);
  assert.equal(lowResults[0].id, "low-1");

  const highResults = filterAndSortAssessments([aLow, aHigh], { risk: "high" });
  assert.equal(highResults.length, 1);
  assert.equal(highResults[0].id, "high-1");
});

test("filterAndSortAssessments: sorts by date ascending and descending", () => {
  const aJan = createMockAssessment({ id: "jan", assessedOn: "2026-01-10" });
  const aFeb = createMockAssessment({ id: "feb", assessedOn: "2026-02-10" });

  const desc = filterAndSortAssessments([aJan, aFeb], { sort: "date_desc" });
  assert.equal(desc[0].id, "feb");
  assert.equal(desc[1].id, "jan");

  const asc = filterAndSortAssessments([aJan, aFeb], { sort: "date_asc" });
  assert.equal(asc[0].id, "jan");
  assert.equal(asc[1].id, "feb");
});
