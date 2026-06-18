import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import styles from './Layout.module.css';

interface LayoutProps {
  children?: ReactNode;
}

const footerLinks = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/account-deletion', label: 'Account Deletion' },
] as const;

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">
              M
            </span>
            <div>
              <p className={styles.brandName}>Memora AI</p>
              <p className={styles.brandTagline}>Legal</p>
            </div>
          </div>
          <nav className={styles.nav} aria-label="Legal pages">
            {footerLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.main}>{children ?? <Outlet />}</main>

      <footer className={styles.footer}>
        <nav className={styles.footerNav} aria-label="Legal footer">
          {footerLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={styles.footerLink}>
              {label}
            </NavLink>
          ))}
        </nav>
        <p>&copy; {new Date().getFullYear()} Memora AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
