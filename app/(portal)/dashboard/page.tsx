import Image from "next/image";
import Link from "next/link";
import { calculateCompletion, classifyRisk } from "@/lib/checklist";
import { summarizeFarmAssessments } from "@/lib/reporting";
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
  const allAssessments = listAssessments(user.id);
  const recentAssessments = allAssessments.slice(0, 4);

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
        {farms.map((farm) => {
          const farmSummary = summarizeFarmAssessments(farm.id, allAssessments);
          return (
            <article className={`card ${styles.farmCard}`} key={farm.id}>
              <div className={styles.farmImage}>
                <Image
                  className={farm.type === "poultry" ? styles.poultryImage : undefined}
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
                  <p><span>{farm.accessRole}</span> access · {farmSummary.totalAssessments} {farmSummary.totalAssessments === 1 ? "record" : "records"}</p>
                  <div className={styles.farmStatusStrip}>
                    {farmSummary.latestRiskLevel ? (
                      <span className={`${styles.farmRiskBadge} ${styles[`risk_${farmSummary.latestRiskLevel}`]}`}>
                        {farmSummary.latestRiskLabel} risk
                      </span>
                    ) : (
                      <span className={styles.farmUnassessed}>No assessments yet</span>
                    )}
                    {farmSummary.latestCompletion !== null ? (
                      <span className={styles.farmCompletion}>
                        {farmSummary.latestCompletion}% complete
                      </span>
                    ) : null}
                    {farmSummary.trend === "improving" ? (
                      <span className={styles.trendImproving} title="Improving trend compared to previous assessment">↑ Improving</span>
                    ) : farmSummary.trend === "declining" ? (
                      <span className={styles.trendDeclining} title="Lower completion compared to previous assessment">↓ Needs review</span>
                    ) : farmSummary.trend === "stable" ? (
                      <span className={styles.trendStable} title="Consistent with previous assessment">→ Stable</span>
                    ) : null}
                  </div>
                </div>
                <div className={styles.farmActionsGroup}>
                  {farmSummary.totalAssessments > 0 ? (
                    <Link className={styles.farmHistoryLink} href={`/history?farm=${farm.id}`}>
                      View records
                    </Link>
                  ) : null}
                  <Link className={styles.farmAction} href={`/checklist?farm=${farm.id}`}>
                    <span>Start checklist</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
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
            const risk = classifyRisk(summary);
            return (
              <Link href={`/history/${assessment.id}`} key={assessment.id}>
                <span className={styles.historyFarmIcon} aria-hidden="true">
                  {assessment.farmType === "pig" ? "P" : "H"}
                </span>
                <span className={styles.historyFarm}>
                  <strong>{assessment.farmName}</strong>
                  <small>{formatDate(assessment.assessedOn)} · {assessment.createdBy}</small>
                </span>
                <span className={`${styles.historyRisk} ${styles[`risk_${risk.level}`]}`}>
                  {risk.label}
                </span>
                <span className={summary.followUp > 0 ? styles.historyFollowUp : styles.historyClear}>
                  {summary.followUp} follow-up
                </span>
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
