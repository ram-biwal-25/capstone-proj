"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./portal.module.css";

type IconName = "overview" | "checklist" | "history" | "risk" | "about";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/checklist", label: "New checklist", icon: "checklist" },
  { href: "/history", label: "Assessment history", icon: "history" },
  { href: "/risk", label: "Risk Estimation", icon: "risk" },
  { href: "/about", label: "About", icon: "about" },
];

function NavIcon({ name }: { name: IconName }) {
  if (name === "overview") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3.5 10.5 8.5-7 8.5 7v9a1 1 0 0 1-1 1h-5v-6h-4v6h-5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "checklist") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v16M4 12h16" />
      </svg>
    );
  }
  if (name === "risk") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (name === "about") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 10.7v5M12 7.8h.01" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav className={styles.desktopNav} aria-label="Main navigation">
      {links.map((link) => (
        <Link
          className={isActive(pathname, link.href) ? styles.activeNavLink : ""}
          href={link.href}
          key={link.href}
        >
          <NavIcon name={link.icon} />
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {links.map((link) => (
        <Link
          className={isActive(pathname, link.href) ? styles.activeMobileLink : ""}
          href={link.href}
          key={link.href}
        >
          <NavIcon name={link.icon} />
          <span>
            {link.icon === "checklist"
              ? "Checklist"
              : link.icon === "history"
                ? "History"
                : link.icon === "risk"
                  ? "Risk"
                  : link.icon === "about"
                    ? "About"
                    : "Overview"}
          </span>
        </Link>
      ))}
    </nav>
  );
}
