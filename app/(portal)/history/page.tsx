import Link from "next/link";
import { calculateCompletion, classifyRisk } from "@/lib/checklist";
import { filterAndSortAssessments } from "@/lib/reporting";
import { listAccessibleFarms, listAssessments } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import styles from "./page.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; risk?: string; farm?: string; sort?: string }>;
}) {
  const user = await requireUser();
  const farms = listAccessibleFarms(user.id);
  const allAssessments = listAssessments(user.id);
  const params = await searchParams;

  const currentFarm = params.farm ?? "all";
  const currentSpecies = params.species ?? "all";
  const currentRisk = params.risk ?? "all";
  const currentSort = params.sort ?? "date_desc";

  const assessments = filterAndSortAssessments(allAssessments, {
    farmId: currentFarm,
    species: currentSpecies,
    risk: currentRisk,
    sort: currentSort,
  });

  const isFiltered =
    currentFarm !== "all" ||
    currentSpecies !== "all" ||
    currentRisk !== "all" ||
    currentSort !== "date_desc";

  return (
    <section>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Saved records</p>
          <h1>Assessment history</h1>
          <p>Review the original answers and follow-up notes from accessible farms.</p>
        </div>
        <Link className="button" href="/checklist"><span aria-hidden="true">＋</span> New checklist</Link>
      </div>

      {allAssessments.length > 0 ? (
        <div className={`card ${styles.filterCard}`}>
          <form className={styles.filterForm} method="get">
            <div className={styles.filterField}>
              <label htmlFor="filter-farm">Farm</label>
              <select id="filter-farm" name="farm" defaultValue={currentFarm}>
                <option value="all">All farms ({farms.length})</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="filter-species">Species</label>
              <select id="filter-species" name="species" defaultValue={currentSpecies}>
                <option value="all">All species</option>
                <option value="pig">Pig</option>
                <option value="poultry">Poultry</option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="filter-risk">Risk Level</label>
              <select id="filter-risk" name="risk" defaultValue={currentRisk}>
                <option value="all">All risk levels</option>
                <option value="low">Low risk</option>
                <option value="moderate">Moderate risk</option>
                <option value="high">High risk</option>
                <option value="critical">Critical risk</option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label htmlFor="filter-sort">Sort By</label>
              <select id="filter-sort" name="sort" defaultValue={currentSort}>
                <option value="date_desc">Date (Newest first)</option>
                <option value="date_asc">Date (Oldest first)</option>
                <option value="completion_desc">Completion (Highest)</option>
                <option value="completion_asc">Completion (Lowest)</option>
              </select>
            </div>

            <div className={styles.filterActions}>
              <button className="button" type="submit">
                Apply
              </button>
              {isFiltered ? (
                <Link className={styles.filterReset} href="/history">
                  Reset
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      {allAssessments.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></svg>
          </span>
          <h2>No assessments yet</h2>
          <p>Complete a farm checklist and it will appear here.</p>
          <Link className="button" href="/checklist">Start first checklist</Link>
        </div>
      ) : assessments.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <h2>No matching assessments</h2>
          <p>No assessment records match your selected filter criteria.</p>
          <Link className="button" href="/history">Clear filters</Link>
        </div>
      ) : (
        <div className={`card ${styles.tableShell}`}>
          <table>
            <thead>
              <tr>
                <th scope="col">Farm</th>
                <th scope="col">Assessment date</th>
                <th scope="col">Checklist completion</th>
                <th scope="col">Risk level</th>
                <th scope="col">Follow-up</th>
                <th scope="col"><span className={styles.visuallyHidden}>Open record</span></th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => {
                const summary = calculateCompletion(assessment.responses);
                const risk = classifyRisk(summary);
                return (
                  <tr key={assessment.id}>
                    <td data-label="Farm">
                      <span className={`${styles.farmGlyph} ${styles[assessment.farmType]}`} aria-hidden="true">
                        {assessment.farmType === "pig" ? "P" : "H"}
                      </span>
                      <span className={styles.farmName}>
                        <strong>{assessment.farmName}</strong>
                        <small>{assessment.farmType === "pig" ? "Pig farm" : "Poultry farm"} · {assessment.createdBy}</small>
                      </span>
                    </td>
                    <td data-label="Assessed">{formatDate(assessment.assessedOn)}</td>
                    <td data-label="Completion">
                      <span className={styles.completion}>{summary.percentage === null ? "N/A" : `${summary.percentage}%`}</span>
                    </td>
                    <td data-label="Risk">
                      <span className={`${styles.riskBadge} ${styles[`risk_${risk.level}`]}`}>
                        {risk.label}
                      </span>
                    </td>
                    <td data-label="Follow-up">
                      <span className={summary.followUp > 0 ? styles.followUp : styles.clear}>
                        {summary.followUp > 0 ? `${summary.followUp} item${summary.followUp === 1 ? "" : "s"}` : "None"}
                      </span>
                    </td>
                    <td>
                      <Link className={styles.openLink} href={`/history/${assessment.id}`} aria-label={`Open assessment for ${assessment.farmName}`}>
                        <span>View</span><b aria-hidden="true">›</b>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
