import styles from './SkeletonLoader.module.css';

export default function SkeletonLoader() {
  return (
    <section className={styles.skeletonGrid} aria-label="Loading content">
      {[1, 2, 3].map((item) => (
        <div key={item} className={styles.skeletonCard}>
          <div className={styles.title} />
          <div className={styles.line} />
          <div className={styles.lineShort} />
          <div className={styles.button} />
        </div>
      ))}
    </section>
  );
}
