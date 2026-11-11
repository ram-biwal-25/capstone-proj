import Link from "next/link";
import { calculateCompletion } from "@/lib/checklist";
import { listAssessments } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import styles from "./page.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function HistoryPage() {
  const user = await requireUser();
  const assessments = listAssessments(user.id);

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

      {assessments.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></svg>
          </span>
          <h2>No assessments yet</h2>
          <p>Complete a farm checklist and it will appear here.</p>
          <Link className="button" href="/checklist">Start first checklist</Link>
        </div>
      ) : (
        <div className={`card ${styles.tableShell}`}>
          <table>
            <thead>
              <tr>
                <th>Farm</th>
                <th>Assessment date</th>
                <th>Checklist completion</th>
                <th>Follow-up</th>
                <th><span className={styles.visuallyHidden}>Open record</span></th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => {
                const summary = calculateCompletion(assessment.responses);
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
