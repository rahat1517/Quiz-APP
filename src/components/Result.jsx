import styles from './Result.module.css';

function getBadge(percentage) {
  if (percentage >= 85) return { label: 'Mastermind', tone: 'excellent' };
  if (percentage >= 65) return { label: 'Competent', tone: 'good' };
  if (percentage >= 40) return { label: 'Growing', tone: 'average' };
  return { label: 'Keep Trying', tone: 'strive' };
}

export default function Result({ result, onRestart }) {
  if (!result) {
    return (
      <section className={styles.resultCard}>
        <h2>Results</h2>
        <p className={styles.empty}>Complete a quiz to unlock your performance report.</p>
      </section>
    );
  }

  const percentage = Math.round((result.score / result.total) * 100);
  const badge = getBadge(percentage);

  return (
    <section className={styles.resultCard}>
      <div className={styles.headerRow}>
        <div>
          <h2>Quiz Results</h2>
          <p className={styles.subtitle}>Your performance summary is ready.</p>
        </div>
        <button type="button" className={styles.restartButton} onClick={onRestart}>
          Restart Quiz
        </button>
      </div>

      <div className={styles.resultBody}>
        <div className={styles.chartWrapper}>
          <div className={styles.chartBase}>
            <div className={styles.chartProgress} style={{ '--progress': `${percentage}%` }} />
            <div className={styles.chartCenter}>
              <span>{percentage}%</span>
              <small>Score</small>
            </div>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span>Correct</span>
            <strong>{result.correct}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Wrong</span>
            <strong>{result.wrong}</strong>
          </div>
          <div className={styles.summaryItemBadge}>
            <span>Performance</span>
            <strong className={styles[badge.tone]}>{badge.label}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
