import styles from './Result.module.css';

function getBadge(percentage) {
  if (percentage >= 85) return { label: 'Mastermind', tone: 'excellent' };
  if (percentage >= 65) return { label: 'Competent', tone: 'good' };
  if (percentage >= 40) return { label: 'Growing', tone: 'average' };
  return { label: 'Keep Trying', tone: 'strive' };
}

export default function Result({ result, history = [], loading, error, onRestart }) {
  const hasHistory = Array.isArray(history) && history.length > 0;
  const currentPercentage = result ? Math.round((result.score / result.total) * 100) : 0;
  const badge = result ? getBadge(currentPercentage) : null;

  const groupedHistory = history.reduce((groups, item) => {
    const classLevel = item.class_level ?? 'Unknown';
    const subject = item.subject ?? 'General';

    if (!groups[classLevel]) {
      groups[classLevel] = {};
    }
    if (!groups[classLevel][subject]) {
      groups[classLevel][subject] = [];
    }
    groups[classLevel][subject].push(item);
    return groups;
  }, {});

  if (!result && !hasHistory) {
    return (
      <section className={styles.resultCard}>
        <h2>Results</h2>
        <p className={styles.empty}>Complete a quiz to unlock your performance report.</p>
      </section>
    );
  }

  return (
    <section className={styles.resultCard}>
      <div className={styles.headerRow}>
        <div>
          <h2>Quiz Results</h2>
          <p className={styles.subtitle}>Your performance summary is ready.</p>
        </div>
        {result && (
          <button type="button" className={styles.restartButton} onClick={onRestart}>
            Restart Quiz
          </button>
        )}
      </div>

      {error && <div className={styles.statusBanner}>{error}</div>}
      {loading && <div className={styles.loading}>Loading previous quiz results…</div>}

      {result && (
        <div className={styles.resultBody}>
          <div className={styles.chartWrapper}>
            <div className={styles.chartBase}>
              <div className={styles.chartProgress} style={{ '--progress': `${currentPercentage}%` }} />
              <div className={styles.chartCenter}>
                <span>{currentPercentage}%</span>
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
            {typeof result.skipped === 'number' && (
              <div className={styles.summaryItem}>
                <span>Skipped</span>
                <strong>{result.skipped}</strong>
              </div>
            )}
            <div className={styles.summaryItem}>
              <span>Marks</span>
              <strong className={styles.scoreBadge}>{result.score} / {result.total}</strong>
            </div>
            <div className={styles.summaryItemBadge}>
              <span>Performance</span>
              <strong className={styles[badge.tone]}>{badge.label}</strong>
            </div>
          </div>
        </div>
      )}

      {hasHistory && (
        <div className={styles.historySection}>
          <h3>Past exams</h3>
          {Object.entries(groupedHistory)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([classLevel, subjects]) => (
              <div key={classLevel} className={styles.historyGroup}>
                <h4>Class {classLevel}</h4>
                {Object.entries(subjects).map(([subject, items]) => (
                  <div key={subject} className={styles.historyGroupSubject}>
                    <h5>{subject}</h5>
                    <div className={styles.historyList}>
                      {items.map((item) => (
                        <article key={item.id} className={styles.historyItem}>
                          <div className={styles.historyHeader}>
                            <strong>{item.subject || 'General'}</strong>
                            <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                          </div>
                          <div className={styles.historyGrid}>
                            <div>
                              <span>Score</span>
                              <strong>{item.score} / {item.total_questions ?? item.total}</strong>
                            </div>
                            <div>
                              <span>Correct</span>
                              <strong>{item.correct_answers}</strong>
                            </div>
                            <div>
                              <span>Wrong</span>
                              <strong>{item.wrong_answers}</strong>
                            </div>
                            <div>
                              <span>Skipped</span>
                              <strong>{(item.total_questions ?? item.total) - (item.correct_answers ?? 0) - (item.wrong_answers ?? 0)}</strong>
                            </div>
                            <div>
                              <span>Percentage</span>
                              <strong>{Number(item.percentage)}%</strong>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
