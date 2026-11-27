import { useEffect, useRef } from 'react';
import { Settings, LogOut, X } from 'lucide-react';
import { Button } from './ui/Button';
import { navItemsFor } from '../lib/navItems';
import styles from './Sidebar.module.css';

// Navigation: brand and class at the top, the main destinations with icon
// tiles, and the signed-in user at the bottom. Fixed on desktop (above
// 1100px); below that it is a drawer opened from the app bar's menu button.
export default function Sidebar({
  open = false,
  onClose,
  activeTab,
  onChange,
  isAdmin,
  classLabel,
  displayName,
  userInitial,
  roleLabel,
  onSignOut,
}) {
  const closeRef = useRef(null);

  // Drawer: Esc closes, focus moves in and back, the page behind can't scroll.
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open, onClose]);

  return (
    <>
    {open && <div className={styles.backdrop} onClick={onClose} aria-hidden />}
    <aside
      id="app-drawer"
      className={open ? `${styles.sidebar} ${styles.open}` : styles.sidebar}
      aria-label="Menu"
    >
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
        <Button
          ref={closeRef}
          type="button"
          className={`${styles.iconButton} ${styles.close}`}
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} aria-hidden />
        </Button>
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
    </>
  );
}
