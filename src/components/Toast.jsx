import styles from './Toast.module.css';

// The live region stays mounted so screen readers reliably announce new
// messages; a region inserted together with its text is often missed.
export default function Toast({ toast }) {
  const type = toast?.type === 'error' ? 'error' : 'success';

  return (
    <div className={styles.region} aria-live={type === 'error' ? 'assertive' : 'polite'}>
      {toast && (
        <div className={`${styles.toast} ${styles[type]}`} role={type === 'error' ? 'alert' : 'status'}>
          <span className={styles.icon} aria-hidden>
            {type === 'error' ? '!' : '✓'}
          </span>
          <p>{toast.message}</p>
        </div>
      )}
    </div>
  );
}
