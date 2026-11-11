import Image from "next/image";
import Link from "next/link";
import { calculateCompletion } from "@/lib/checklist";
import { listAccessibleFarms, listAssessments } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import styles from "./page.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const farms = listAccessibleFarms(user.id);
  const recentAssessments = listAssessments(user.id).slice(0, 3);

  return (
    <section className={styles.page}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Internal biosecurity records</p>
          <h1>Farm overview</h1>
        </div>
        <p className={styles.welcome}>Welcome back, <strong>{user.name}</strong></p>
      </div>

      <Link className={styles.startCard} href="/checklist">
        <span className={styles.plusIcon} aria-hidden="true">+</span>
        <span>
          <strong>Start a checklist</strong>
          <small>Record today&apos;s farm biosecurity checks</small>
        </span>
        <svg className={styles.contours} viewBox="0 0 430 120" aria-hidden="true">
          <path d="M15 110C95 50 135 116 204 65S321 13 425 41" />
          <path d="M65 120c62-52 116 2 176-47s115-38 187-17" />
          <path d="M142 120c48-31 88-2 133-36s91-29 154-10" />
          <path d="M238 120c36-18 62-3 94-23s61-17 100-5" />
        </svg>
        <span className={styles.actionArrow} aria-hidden="true">→</span>
      </Link>

      <div className={styles.sectionHeading}>
        <div>
          <h2>Your farms</h2>
          <p>{farms.length} accessible {farms.length === 1 ? "farm" : "farms"}</p>
        </div>
      </div>

      <div className={styles.farmGrid}>
        {farms.map((farm) => (
          <article className={`card ${styles.farmCard}`} key={farm.id}>
            <div className={styles.farmImage}>
              <Image
                alt={`${farm.type === "pig" ? "Pigs" : "Chickens"} at ${farm.name}`}
                fill
                priority
                sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 520px"
                src={farm.type === "pig" ? "/images/sample-pig-farm.jpg" : "/images/sample-poultry-farm.jpg"}
              />
              <span>{farm.type === "pig" ? "Pig farm" : "Poultry farm"}</span>
            </div>
            <div className={styles.farmDetails}>
              <div>
                <h3>{farm.name}</h3>
                <p><span>{farm.accessRole}</span> access</p>
              </div>
              <Link aria-label={`Start checklist for ${farm.name}`} href={`/checklist?farm=${farm.id}`}>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.sectionHeading}>
        <div>
          <h2>Assessment history</h2>
          <p>Recent self-assessment records</p>
        </div>
        {recentAssessments.length > 0 ? <Link href="/history">View all <span aria-hidden="true">→</span></Link> : null}
      </div>

      {recentAssessments.length === 0 ? (
        <div className={`card ${styles.emptyHistory}`}>
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></svg>
          </div>
          <h3>No assessments yet</h3>
          <p>Start a checklist to create your first assessment.</p>
          <Link className="button" href="/checklist">Start a checklist</Link>
        </div>
      ) : (
        <div className={`card ${styles.recentHistory}`}>
          {recentAssessments.map((assessment) => {
            const summary = calculateCompletion(assessment.responses);
            return (
              <Link href={`/history/${assessment.id}`} key={assessment.id}>
                <span className={styles.historyFarmIcon} aria-hidden="true">
                  {assessment.farmType === "pig" ? "P" : "H"}
                </span>
                <span className={styles.historyFarm}>
                  <strong>{assessment.farmName}</strong>
                  <small>{formatDate(assessment.assessedOn)} · {assessment.createdBy}</small>
                </span>
                <span className={styles.historyFollowUp}>{summary.followUp} follow-up</span>
                <span className={styles.historyScore}>{summary.percentage === null ? "N/A" : `${summary.percentage}%`}</span>
                <span className={styles.rowArrow} aria-hidden="true">›</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
