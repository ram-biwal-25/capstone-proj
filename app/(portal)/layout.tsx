import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listAccessibleFarms } from "@/lib/repository";
import { DesktopNavigation, MobileNavigation } from "./portal-nav";
import { MobileAccountButton, SidebarAccount } from "./profile-dialog";
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
  const farms = listAccessibleFarms(user.id);

  // Ensure plain objects with Object.prototype for Client Component serialization
  const plainUser = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const plainFarms = farms.map((farm) => ({
    id: farm.id,
    name: farm.name,
    type: farm.type,
    accessRole: farm.accessRole,
    animalCount: farm.animalCount,
  }));

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/dashboard">
          <BrandMark />
          <span>FarmWard</span>
        </Link>
        <DesktopNavigation />
        <SidebarAccount user={plainUser} farms={plainFarms} />
      </aside>

      <header className={styles.mobileHeader}>
        <Link className={styles.mobileBrand} href="/dashboard">
          <BrandMark />
          <span>FarmWard</span>
        </Link>
        <MobileAccountButton user={plainUser} farms={plainFarms} />
      </header>

      <main className={styles.main}>{children}</main>
      <MobileNavigation />
    </div>
  );
}
