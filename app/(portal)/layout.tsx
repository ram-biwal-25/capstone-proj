import Link from "next/link";
import { requireUser } from "@/lib/session";
import { DesktopNavigation, MobileNavigation } from "./portal-nav";
import styles from "./portal.module.css";

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#1D5138" d="M16 2 28 7v8c0 7-5 12-12 15C9 27 4 22 4 15V7z" />
      <path fill="#FFF7E7" d="M9 22c0-8 6-11 14-12 0 8-5 13-12 13l-2 2-1-1z" />
      <path fill="none" stroke="#1D5138" strokeWidth="1.6" strokeLinecap="round" d="M10 22c3-3 6-5 10-8" />
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
          <span>FarmWard</span>
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
          <span>FarmWard</span>
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
