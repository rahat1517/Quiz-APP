import { Settings, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { navItemsFor } from '../lib/navItems';
import styles from './Sidebar.module.css';

// Desktop navigation (above 1100px): brand and class at the top, the main
// destinations with icon tiles, and the signed-in user at the bottom.
export default function Sidebar({
  activeTab,
  onChange,
  isAdmin,
  classLabel,
  displayName,
  userInitial,
  roleLabel,
  onSignOut,
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <Button
          type="button"
          className={styles.brand}
          onClick={() => onChange('dashboard')}
          aria-label="Quiz World, go to dashboard"
        >
          <span className={styles.brandMark} aria-hidden>Q</span>
          <span className={styles.brandName}>Quiz World</span>
        </Button>
        {classLabel && <span className={styles.classPill}>{classLabel}</span>}
      </div>

      <nav className={styles.nav} aria-label="Main navigation">
        {navItemsFor(isAdmin).map(({ id, label, Icon, tint }) => {
          const active = activeTab === id;
          return (
            <Button
              key={id}
              type="button"
              className={active ? `${styles.item} ${styles.active}` : styles.item}
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`${styles.iconTile} ${styles[tint]}`} aria-hidden>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span>{label}</span>
            </Button>
          );
        })}
      </nav>

      <div className={styles.userCard}>
        <span className={styles.avatar} aria-hidden>{userInitial}</span>
        <span className={styles.userText}>
          <strong>{displayName}</strong>
          <small>{roleLabel}</small>
        </span>
        <Button
          type="button"
          className={styles.iconButton}
          onClick={() => onChange('profile')}
          aria-label="Profile settings"
          title="Profile settings"
        >
          <Settings size={18} aria-hidden />
        </Button>
        <Button
          type="button"
          className={styles.iconButton}
          onClick={onSignOut}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} aria-hidden />
        </Button>
      </div>
    </aside>
  );
}
