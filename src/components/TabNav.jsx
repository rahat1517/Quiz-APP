import styles from './TabNav.module.css';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home' },
  { id: 'profile', label: 'Profile', shortLabel: 'Profile' },
  { id: 'add', label: 'Add Question', shortLabel: 'Add' },
  { id: 'bank', label: 'Question Bank', shortLabel: 'Bank' },
  { id: 'quiz', label: 'Start Quiz', shortLabel: 'Quiz' },
  { id: 'results', label: 'Results', shortLabel: 'Results' },
];

export default function TabNav({ activeTab, onChange, variant, isAdmin }) {
  const navClass = variant === 'bottom' ? `${styles.tabNav} ${styles.bottomNav}` : styles.tabNav;
  const availableTabs = isAdmin ? tabs : tabs.filter((tab) => tab.id !== 'add');

  return (
    <nav
      className={navClass}
      aria-label="Main navigation"
      style={{ '--tab-count': availableTabs.length }}
    >
      {availableTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? `${styles.tabItem} ${styles.active}` : styles.tabItem}
          onClick={() => onChange(tab.id)}
        >
          <span className={styles.fullLabel}>{tab.label}</span>
          <span className={styles.shortLabel}>{tab.shortLabel}</span>
        </button>
      ))}
    </nav>
  );
}
