import styles from './Toast.module.css';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="status" aria-live="polite">
      <p>{toast.message}</p>
    </div>
  );
}
