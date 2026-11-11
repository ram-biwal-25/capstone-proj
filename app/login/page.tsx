import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";
import styles from "./page.module.css";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className={styles.main}>
      <section className={`card ${styles.loginCard}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <path d="M20 3.5 34 9v9.8c0 8.4-5.4 14.4-14 17.7C11.4 33.2 6 27.2 6 18.8V9z" />
              <path d="M14 24c7.2.7 11.5-3.4 13.2-10-6.5.3-11.6 2.3-13.2 10Z" />
              <path d="M13.5 27c2.7-4.2 6.2-6.7 10.3-8.1" />
            </svg>
          </span>
          <strong>BioFarm Portal</strong>
        </div>
        <p className={styles.eyebrow}>Digital Farm Management Portal</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to complete and review farm biosecurity self-assessments.</p>
        <div className={styles.sampleNotice}>
          <strong>Sample account</strong>
          <span>farmer@example.com · demo123</span>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
