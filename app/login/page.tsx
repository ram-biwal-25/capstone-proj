import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";
import styles from "./page.module.css";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className={styles.main}>
      <section className={`card ${styles.loginCard}`}>
        <div className={styles.brandMark} aria-hidden="true">BF</div>
        <p className={styles.eyebrow}>Digital Farm Management Portal</p>
        <h1>Farm biosecurity records</h1>
        <p className="muted">Sign in to complete and review internal self-assessments.</p>
        <div className={styles.sampleNotice}>
          <strong>Sample account</strong>
          <span>farmer@example.com · demo123</span>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
