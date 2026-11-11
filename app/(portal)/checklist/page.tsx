import { listAccessibleFarms } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import { ChecklistForm } from "./checklist-form";
import styles from "./page.module.css";

export default async function ChecklistPage() {
  const user = await requireUser();
  const farms = listAccessibleFarms(user.id);

  return (
    <section>
      <p className={styles.eyebrow}>New internal record</p>
      <h1 className={styles.title}>Farm biosecurity checklist</h1>
      <p className={`muted ${styles.intro}`}>
        Complete this short record-keeping review. It supports farm follow-up and does not make an
        official compliance determination.
      </p>
      {farms.length === 0 ? (
        <div className={`card ${styles.empty}`}>No farms are assigned to your account.</div>
      ) : (
        <ChecklistForm farms={farms} />
      )}
    </section>
  );
}
