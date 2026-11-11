import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>About FarmWard</p>
      <h1>Biosecurity records, kept simple.</h1>
      <p className={styles.intro}>
        FarmWard is a Digital Farm Management Portal that helps pig and poultry farms record routine internal biosecurity self-assessments.
      </p>

      <div className={styles.grid}>
        <article className="card">
          <span className={styles.number}>01</span>
          <h2>Choose a farm</h2>
          <p>Farmers and veterinarians only see farms they have been authorised to access.</p>
        </article>
        <article className="card">
          <span className={styles.number}>02</span>
          <h2>Complete a checklist</h2>
          <p>Record each item as Done, Needs follow-up, or Not applicable, with an optional note.</p>
        </article>
        <article className="card">
          <span className={styles.number}>03</span>
          <h2>Review the history</h2>
          <p>Saved records show checklist completion and the original answers for later review.</p>
        </article>
      </div>

      <article className={`card ${styles.scope}`}>
        <h2>What this feature covers</h2>
        <p>It supports self-assessment record keeping, including visitor logs, equipment cleaning, entry controls, animal observations, feed and water checks, and mortality records.</p>
        <p>Sample farms and sample records are clearly marked for demonstration. FarmWard does not make official compliance determinations or publish live outbreak notices.</p>
      </article>
    </section>
  );
}
