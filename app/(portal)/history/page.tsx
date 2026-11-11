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
          <h1>Assessment History</h1>
          <p className="muted">Newest records appear first.</p>
        </div>
        <Link className="button" href="/checklist">New checklist</Link>
      </div>

      {assessments.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <h2>No assessments yet</h2>
          <p className="muted">Complete a farm checklist and it will appear here.</p>
          <Link className="button" href="/checklist">Start first checklist</Link>
        </div>
      ) : (
        <div className={styles.historyList}>
          {assessments.map((assessment) => {
            const summary = calculateCompletion(assessment.responses);
            return (
              <Link className={`card ${styles.historyCard}`} href={`/history/${assessment.id}`} key={assessment.id}>
                <div>
                  <span className={styles.farmType}>
                    {assessment.farmType === "pig" ? "Pig farm" : "Poultry farm"}
                  </span>
                  <h2>{assessment.farmName}</h2>
                  <p className="muted">Assessed {formatDate(assessment.assessedOn)} · by {assessment.createdBy}</p>
                </div>
                <div className={styles.cardSummary}>
                  <strong>{summary.percentage === null ? "N/A" : `${summary.percentage}%`}</strong>
                  <span>Checklist completion</span>
                  <small>{summary.followUp} follow-up</small>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
