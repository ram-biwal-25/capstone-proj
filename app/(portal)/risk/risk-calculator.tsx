"use client";

import React, { useMemo, useState } from "react";
import {
  calculateRiskScore,
  RISK_FACTORS,
  type RiskFactorId,
} from "@/lib/risk";
import type { Farm } from "@/lib/types";
import styles from "./page.module.css";

interface RiskCalculatorProps {
  farms: Farm[];
  initialFarmId?: string;
}

const createInitialRatings = (): Record<RiskFactorId, number> => ({
  visitor_management: 0,
  quarantine: 0,
  cleaning_disinfection: 0,
  feed_water_hygiene: 0,
  waste_disposal: 0,
  pest_control: 0,
  vaccination_health: 0,
});

export function RiskCalculator({ farms, initialFarmId }: RiskCalculatorProps) {
  const [selectedFarmId, setSelectedFarmId] = useState(
    initialFarmId || farms[0]?.id || "",
  );

  // Default ratings: 0 (No risk) for each factor
  const [ratings, setRatings] = useState<Record<RiskFactorId, number>>(createInitialRatings);

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const isPig = selectedFarm?.type === "pig";

  const handleSelectOption = (factorId: RiskFactorId, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [factorId]: value,
    }));
  };

  const handleReset = () => {
    setRatings(createInitialRatings());
  };

  // Calculate score and classification
  const result = useMemo(() => calculateRiskScore(ratings), [ratings]);

  // Priority recommendations sorted by contribution descending
  const activeRecommendations = useMemo(() => {
    return RISK_FACTORS.filter((factor) => (ratings[factor.id] ?? 0) > 0).sort(
      (a, b) => {
        const contribA = result.weightedContributions[a.id] ?? 0;
        const contribB = result.weightedContributions[b.id] ?? 0;
        return contribB - contribA;
      },
    );
  }, [ratings, result.weightedContributions]);

  // Color classes and meter widths
  const scoreBannerClass =
    result.classification === "Low"
      ? styles.scoreBannerLow
      : result.classification === "Moderate"
        ? styles.scoreBannerModerate
        : result.classification === "High"
          ? styles.scoreBannerHigh
          : styles.scoreBannerCritical;

  const meterFillColor =
    result.classification === "Low"
      ? "#2e7d32"
      : result.classification === "Moderate"
        ? "#e6a100"
        : result.classification === "High"
          ? "#e65100"
          : "#c62828";

  return (
    <div className={styles.page}>
      {/* Heading */}
      <div className={styles.headingRow}>
        <p className={styles.eyebrow}>Farm Biosecurity Self-Assessment</p>
        <h1>Biosecurity Risk Estimation</h1>
        <p className={styles.intro}>
          Evaluate risk across farm hygiene, visitor entry, animal quarantine, feed storage,
          disinfection, and disease history. The weighted model estimates vulnerability to
          infectious pathogens such as African Swine Fever (ASF) and Highly Pathogenic Avian
          Influenza (HPAI).
        </p>
      </div>

      {/* Formula & Weight Model Explanation */}
      <article className={styles.formulaCard}>
        <div className={styles.formulaHeader}>
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10M6 10h10M6 14h6" />
            </svg>
            Biosecurity Risk Formula
          </h3>
          <span className={styles.formulaCode}>
            Risk Score = [ Σ (Wᵢ × Rᵢ) / Σ Wᵢ ] × 100
          </span>
        </div>
        <p className={styles.formulaExplain}>
          Where <strong>Wᵢ</strong> is the weight assigned to each factor (totaling 100%), and{" "}
          <strong>Rᵢ</strong> is the assessed risk level between <strong>0 (No risk)</strong> and{" "}
          <strong>1 (Very high risk)</strong>. For example, if poor quarantine practices receive a risk rating of 1, their contribution is{" "}
          <strong>20% × 1.0 = 20.0 points</strong>.
        </p>
      </article>

      {/* Farm Selection Bar */}
      {farms.length > 0 && (
        <div className={styles.farmSelectorRow}>
          <div className={styles.farmSelectorGroup}>
            <label htmlFor="farm-selector">Select Farm for Assessment:</label>
            <select
              id="farm-selector"
              className={styles.farmSelect}
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type === "pig" ? "Pig Farm" : "Poultry Farm"})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="button secondary"
            style={{ minHeight: "38px", padding: "6px 14px", fontSize: "0.84rem" }}
            onClick={handleReset}
          >
            Reset All Factors
          </button>
        </div>
      )}

      {/* Main Grid: Questions Left, Sticky Scorecard Right */}
      <div className={styles.layoutGrid}>
        {/* Left Column: 7 Factors Questions */}
        <div className={styles.questionsList}>
          {RISK_FACTORS.map((factor, index) => {
            const currentR = ratings[factor.id] ?? 0;
            const contribution = result.weightedContributions[factor.id] ?? 0;

            return (
              <section className={styles.factorCard} key={factor.id}>
                <div className={styles.factorHeader}>
                  <div className={styles.factorTitleGroup}>
                    <h3 className={styles.factorName}>
                      {index + 1}. {factor.name}
                    </h3>
                    <p className={styles.factorDesc}>{factor.description}</p>
                  </div>
                  <div className={styles.factorMetaBadges}>
                    <span className={styles.weightBadge} title="Factor Weight">
                      Weight: {factor.weight}%
                    </span>
                    <span className={styles.contributionBadge} title="Current Contribution">
                      Score: +{contribution.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Species specific note */}
                <div className={styles.speciesTip}>
                  <strong>{isPig ? "Pig Biosecurity Note:" : "Poultry Biosecurity Note:"}</strong>{" "}
                  {isPig ? factor.pigSpecificNotes : factor.poultrySpecificNotes}
                </div>

                {/* Option Choices */}
                <div className={styles.optionsGroup} role="radiogroup" aria-label={factor.name}>
                  {factor.options.map((option) => {
                    const isSelected = currentR === option.riskValue;
                    return (
                      <button
                        type="button"
                        key={option.riskValue}
                        role="radio"
                        aria-checked={isSelected}
                        className={`${styles.optionButton} ${isSelected ? styles.selectedOption : ""}`}
                        onClick={() => handleSelectOption(factor.id, option.riskValue)}
                      >
                        <div className={styles.optionRadio} aria-hidden="true" />
                        <div className={styles.optionContent}>
                          <span className={styles.optionLabel}>
                            {option.label}
                            {option.riskValue > 0 && (
                              <small style={{ marginLeft: "8px", color: "#8a5806" }}>
                                (Rᵢ = {option.riskValue.toFixed(2)})
                              </small>
                            )}
                          </span>
                          <span className={styles.optionDesc}>{option.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Right Column: Sticky Live Scorecard */}
        <aside className={styles.scoreStickyCard}>
          {/* Big Score Display */}
          <div className={`${styles.scoreBanner} ${scoreBannerClass}`}>
            <span className={styles.scoreLabel}>Overall Risk Score</span>
            <div className={styles.scoreNumber}>{result.score.toFixed(0)}</div>
            <span className={styles.scoreOutOf}>out of 100</span>
            <div className={styles.riskLevelBadge}>
              <span>Risk Level:</span>
              <strong>{result.classification}</strong>
            </div>
          </div>

          {/* Visual Risk Meter */}
          <div className={styles.meterContainer}>
            <div className={styles.meterTrack}>
              <div className={`${styles.meterSection} ${styles.meterSectionLow}`} title="Low (0-25)" />
              <div className={`${styles.meterSection} ${styles.meterSectionModerate}`} title="Moderate (26-50)" />
              <div className={`${styles.meterSection} ${styles.meterSectionHigh}`} title="High (51-75)" />
              <div className={`${styles.meterSection} ${styles.meterSectionCritical}`} title="Critical (76-100)" />
              <div
                className={styles.meterFill}
                style={{
                  width: `${Math.min(100, Math.max(0, result.score))}%`,
                  backgroundColor: meterFillColor,
                }}
              />
            </div>
            <div className={styles.meterLabels}>
              <span>0 (Low)</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100 (Critical)</span>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className={styles.breakdownSection}>
            <h4 className={styles.breakdownTitle}>Factor Contributions</h4>
            <div className={styles.breakdownList}>
              {RISK_FACTORS.map((f) => {
                const r = ratings[f.id] ?? 0;
                const contrib = result.weightedContributions[f.id] ?? 0;
                return (
                  <div className={styles.breakdownItem} key={f.id}>
                    <span className={styles.breakdownItemName}>{f.name}</span>
                    <div className={styles.breakdownItemVal}>
                      <span className={styles.breakdownFormula}>
                        {f.weight}% × {r.toFixed(2)}
                      </span>
                      <span className={styles.breakdownContrib}>+{contrib.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className={styles.recommendationsSection}>
            <h4 className={styles.recommendationsTitle}>
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.2" fill="none">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Recommended Improvements ({activeRecommendations.length})
            </h4>

            {activeRecommendations.length === 0 ? (
              <div style={{ fontSize: "0.82rem", color: "#1d5138", background: "#f0f7ee", padding: "12px", borderRadius: "10px" }}>
                ✓ Outstanding biosecurity! All assessed factors are currently at minimum risk level.
              </div>
            ) : (
              <div className={styles.recommendationList}>
                {activeRecommendations.map((f) => (
                  <div className={styles.recommendationCard} key={f.id}>
                    <h5>
                      {f.name} (Risk Contribution: +{result.weightedContributions[f.id].toFixed(1)})
                    </h5>
                    <p>{f.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mandatory Veterinarian Validation Disclaimer */}
          <div className={styles.disclaimerCard}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p>
              <strong>Important:</strong> These weights and thresholds are initial prototype values,
              not scientifically validated disease-risk predictions. Have veterinarians validate them
              separately for pig and poultry farms before deployment.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
