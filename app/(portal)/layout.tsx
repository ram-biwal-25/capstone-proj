import Link from "next/link";
import { requireUser } from "@/lib/session";
import styles from "./portal.module.css";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link className={styles.brand} href="/dashboard">BioFarm Portal</Link>
          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="/checklist">New checklist</Link>
            <Link href="/history">Assessment history</Link>
          </nav>
          <div className={styles.account}>
            <span title={user.email}>{user.name}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className={`container ${styles.main}`}>{children}</main>
    </>
  );
}
