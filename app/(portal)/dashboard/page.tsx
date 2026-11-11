import Link from "next/link";
import { listAccessibleFarms } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const user = await requireUser();
  const farms = listAccessibleFarms(user.id);

  return (
    <section>
      <p className={styles.eyebrow}>Internal self-assessment</p>
      <h1 className={styles.title}>Welcome, {user.name}</h1>
      <p className={`muted ${styles.intro}`}>
        Record routine biosecurity checks for farms you can access. These records are not official
        compliance determinations or live outbreak notices.
      </p>

      <div className={styles.actions}>
        <Link className="button" href="/checklist">Start a checklist</Link>
        <Link className="button secondary" href="/history">View assessment history</Link>
      </div>

      <h2 className={styles.sectionTitle}>Your farms</h2>
      <div className={styles.farmGrid}>
        {farms.map((farm) => (
          <article className={`card ${styles.farmCard}`} key={farm.id}>
            <span className={styles.farmType}>{farm.type === "pig" ? "Pig farm" : "Poultry farm"}</span>
            <h3>{farm.name}</h3>
            <p className="muted">Access: {farm.accessRole}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
