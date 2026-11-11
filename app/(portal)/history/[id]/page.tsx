import Link from "next/link";
import { notFound } from "next/navigation";
import { calculateCompletion, STATUS_LABELS } from "@/lib/checklist";
import { findAssessmentById } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import styles from "./page.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const assessment = findAssessmentById(user.id, id);
  if (!assessment) notFound();

  const summary = calculateCompletion(assessment.responses);
  const saved = (await searchParams).saved === "1";

  return (
    <section>
      {saved ? <div className={styles.success} role="status">Assessment saved successfully.</div> : null}
      <Link className={styles.backLink} href="/history">← Assessment History</Link>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Saved internal self-assessment</p>
          <h1>{assessment.farmName}</h1>
          <p className="muted">
            {assessment.farmType === "pig" ? "Pig farm" : "Poultry farm"} · Assessed {formatDate(assessment.assessedOn)}
          </p>
        </div>
        <div className={`card ${styles.score}`}>
          <strong>{summary.percentage === null ? "N/A" : `${summary.percentage}%`}</strong>
          <span>Checklist completion</span>
        </div>
      </div>

      {summary.percentage === null ? (
        <p className={styles.naMessage}>Checklist completion is not calculated because every item was marked Not applicable.</p>
      ) : null}

      <div className={styles.counts}>
        <span><strong>{summary.done}</strong> Done</span>
        <span><strong>{summary.followUp}</strong> Needs follow-up</span>
        <span><strong>{summary.notApplicable}</strong> Not applicable</span>
      </div>

      <div className={styles.responses}>
        {assessment.responses.map((response, index) => (
          <article className={`card ${styles.responseCard}`} key={response.itemId}>
            <div className={styles.responseHeading}>
              <h2><span>{index + 1}</span>{response.label}</h2>
              <strong className={styles[response.status]}>{STATUS_LABELS[response.status]}</strong>
            </div>
            <div className={styles.note}>
              <span>Note</span>
              <p>{response.note || "No note added."}</p>
            </div>
          </article>
        ))}
      </div>

      <footer className={styles.recordFooter}>
        Recorded by {assessment.createdBy} on {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(assessment.createdAt))}
      </footer>
    </section>
  );
}
