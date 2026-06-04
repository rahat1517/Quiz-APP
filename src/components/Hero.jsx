import styles from './Hero.module.css';

export default function Hero({ totalQuestions, totalSubjects, totalQuizzes }) {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroPanel}>
        <div>
          <span className={styles.badge}>Quiz World</span>
          <h1>Quiz World</h1>
          <p>Test your knowledge anytime with curated quizzes and smart progress tracking.</p>
        </div>
        <div className={styles.heroAccent} />
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p>Total Questions</p>
          <strong>{totalQuestions}</strong>
        </article>
        <article className={styles.statCard}>
          <p>Total Subjects</p>
          <strong>{totalSubjects}</strong>
        </article>
        <article className={styles.statCard}>
          <p>Total Quizzes</p>
          <strong>{totalQuizzes}</strong>
        </article>
      </div>
    </section>
  );
}
