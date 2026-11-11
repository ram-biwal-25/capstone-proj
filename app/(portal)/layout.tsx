import Link from "next/link";
import { requireUser } from "@/lib/session";
import { DesktopNavigation, MobileNavigation } from "./portal-nav";
import styles from "./portal.module.css";

function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 3.5 34 9v9.8c0 8.4-5.4 14.4-14 17.7C11.4 33.2 6 27.2 6 18.8V9z" />
      <path d="M14 24c7.2.7 11.5-3.4 13.2-10-6.5.3-11.6 2.3-13.2 10Z" />
      <path d="M13.5 27c2.7-4.2 6.2-6.7 10.3-8.1" />
    </svg>
  );
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/dashboard">
          <BrandMark />
          <span>BioFarm Portal</span>
        </Link>
        <DesktopNavigation />
        <div className={styles.sidebarAccount}>
          <div className={styles.avatar} aria-hidden="true">{user.name.charAt(0)}</div>
          <div className={styles.accountText}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" aria-label="Sign out" title="Sign out">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5H5v14h4M14 8l4 4-4 4M8 12h10" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <Link className={styles.mobileBrand} href="/dashboard">
          <BrandMark />
          <span>BioFarm Portal</span>
        </Link>
        <form action="/api/auth/logout" method="post">
          <button type="submit" aria-label={`Sign out ${user.name}`} title="Sign out">
            <span>{user.name.charAt(0)}</span>
          </button>
        </form>
      </header>

      <main className={styles.main}>{children}</main>
      <MobileNavigation />
    </div>
  );
}
