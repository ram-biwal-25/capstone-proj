import { listAccessibleFarms } from "@/lib/repository";
import { requireUser } from "@/lib/session";
import { ChecklistForm } from "./checklist-form";
import styles from "./page.module.css";

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ farm?: string }>;
}) {
  const user = await requireUser();
  const farms = listAccessibleFarms(user.id);
  const requestedFarm = (await searchParams).farm;
  const initialFarmId = farms.some((farm) => farm.id === requestedFarm)
    ? requestedFarm
    : farms[0]?.id;

  return (
    <section>
      <div className={styles.pageHeading}>
        <p className={styles.eyebrow}>New internal record</p>
        <h1 className={styles.title}>Biosecurity checklist</h1>
        <p className={`muted ${styles.intro}`}>
          Review routine farm records and flag anything that needs follow-up.
        </p>
      </div>
      {farms.length === 0 ? (
        <div className={`card ${styles.empty}`}>No farms are assigned to your account.</div>
      ) : (
        <ChecklistForm farms={farms} initialFarmId={initialFarmId} />
      )}
    </section>
  );
}
