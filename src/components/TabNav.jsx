import styles from './TabNav.module.css';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Profile' },
  { id: 'add', label: 'Add Question' },
  { id: 'bank', label: 'Question Bank' },
  { id: 'quiz', label: 'Start Quiz' },
  { id: 'results', label: 'Results' },
];

export default function TabNav({ activeTab, onChange, variant, isAdmin }) {
  const navClass = variant === 'bottom' ? `${styles.tabNav} ${styles.bottomNav}` : styles.tabNav;
  const availableTabs = isAdmin ? tabs : tabs.filter((tab) => tab.id !== 'add');

  return (
    <nav className={navClass} aria-label="Main navigation">
      {availableTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? `${styles.tabItem} ${styles.active}` : styles.tabItem}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
