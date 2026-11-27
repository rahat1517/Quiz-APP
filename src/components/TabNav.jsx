import styles from './TabNav.module.css';
import { Button } from './ui/Button';
import { navItemsFor } from '../lib/navItems';

// Top tabs on tablets (781–1100px) and the bottom tab bar on phones.
// Desktop uses <Sidebar>.
export default function TabNav({ activeTab, onChange, variant, isAdmin }) {
  const navClass =
    variant === 'bottom' ? `${styles.tabNav} ${styles.bottomNav}` : `${styles.tabNav} ${styles.topNav}`;
  const items = navItemsFor(isAdmin);

  return (
    <nav
      className={navClass}
      aria-label="Main navigation"
      style={{ '--tab-count': items.length }}
    >
      {items.map(({ id, label, shortLabel, Icon }) => (
        <Button
          key={id}
          type="button"
          className={activeTab === id ? `${styles.tabItem} ${styles.active}` : styles.tabItem}
          onClick={() => onChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          {variant === 'bottom' && <Icon className={styles.tabIcon} size={20} aria-hidden />}
          <span className={styles.fullLabel}>{label}</span>
          <span className={styles.shortLabel}>{shortLabel}</span>
        </Button>
      ))}
    </nav>
  );
}
