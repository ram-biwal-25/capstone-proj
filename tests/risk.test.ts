import assert from "node:assert/strict";
import test from "node:test";
import { calculateRiskScore, classifyRisk, RISK_FACTORS, type RiskFactorId } from "../lib/risk";

test("biosecurity factors have total weight of 100%", () => {
  const totalWeight = RISK_FACTORS.reduce((sum, f) => sum + f.weight, 0);
  assert.equal(totalWeight, 100);
});

test("single factor example: quarantine with risk rating 1 contributes 20", () => {
  const ratings: Record<RiskFactorId, number> = {
    visitor_management: 0,
    quarantine: 1, // 20 * 1 = 20
    cleaning_disinfection: 0,
    feed_water_hygiene: 0,
    waste_disposal: 0,
    pest_control: 0,
    vaccination_health: 0,
  };

  const result = calculateRiskScore(ratings);
  assert.equal(result.weightedContributions.quarantine, 20);
  assert.equal(result.score, 20);
  assert.equal(result.classification, "Low");
});

test("all zero ratings produces 0 score and Low risk", () => {
  const ratings: Record<RiskFactorId, number> = {
    visitor_management: 0,
    quarantine: 0,
    cleaning_disinfection: 0,
    feed_water_hygiene: 0,
    waste_disposal: 0,
    pest_control: 0,
    vaccination_health: 0,
  };

  const result = calculateRiskScore(ratings);
  assert.equal(result.score, 0);
  assert.equal(result.classification, "Low");
});

test("all maximum ratings produces 100 score and Critical risk", () => {
  const ratings: Record<RiskFactorId, number> = {
    visitor_management: 1,
    quarantine: 1,
    cleaning_disinfection: 1,
    feed_water_hygiene: 1,
    waste_disposal: 1,
    pest_control: 1,
    vaccination_health: 1,
  };

  const result = calculateRiskScore(ratings);
  assert.equal(result.score, 100);
  assert.equal(result.classification, "Critical");
});

test("risk classification thresholds match specifications", () => {
  assert.equal(classifyRisk(0), "Low");
  assert.equal(classifyRisk(25), "Low");
  assert.equal(classifyRisk(26), "Moderate");
  assert.equal(classifyRisk(50), "Moderate");
  assert.equal(classifyRisk(51), "High");
  assert.equal(classifyRisk(75), "High");
  assert.equal(classifyRisk(76), "Critical");
  assert.equal(classifyRisk(100), "Critical");
});
