import styles from './Footer.module.css';

export default function Footer({ honorActive }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLeft}>
          <p className={styles.copyright}>© {currentYear} Quiz World · Made by <strong>Rahat</strong></p>
        </div>

        <div className={styles.footerRight}>
          {honorActive && (
            <p className={styles.honorName}>🎖️ Honored by G. M. Rashidul Islam Rahat</p>
          )}
        </div>
      </div>
    </footer>
  );
}
