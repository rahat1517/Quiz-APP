import styles from './Hero.module.css';
import { formatClassLevel } from '../lib/normalizeClassLevel';

const subjectIcons = ['∑', '⚗', 'A', '⌘'];

export default function Hero({
  totalQuestions,
  totalSubjects,
  totalQuizzes,
  userName = 'Learner',
  classLabel,
  subjects = [],
  history = [],
  onNavigate,
  onStartSubject,
}) {
  const displaySubjects =
    subjects.length > 0 ? subjects : ['Mathematics', 'Science', 'Language', 'Technology'];
  const displayClass = classLabel ? formatClassLevel(classLabel) : null;
  const bestPercentage = history.reduce(
    (best, item) => Math.max(best, Number(item.percentage) || 0),
    0
  );
  const latestResult = history[0];

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroPanel}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>
            <span className={styles.liveDot} />
            Ready when you are
          </span>
          <p className={styles.welcome}>Welcome back, {userName}</p>
          <h1>How far can your knowledge take you today?</h1>
          <p className={styles.heroCopy}>
            Build a quiz from your class, subject, and chapter. Get instant
            results and learn from every answer.
          </p>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => onNavigate?.('quiz')}
            >
              Start a quiz <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => onNavigate?.('bank')}
            >
              Explore questions
            </button>
          </div>
        </div>

        <button
          type="button"
          className={styles.challengeCard}
          onClick={() => onNavigate?.('quiz')}
        >
          <div className={styles.challengeTop}>
            <span>Quick challenge</span>
            <span className={styles.challengeIcon}>Q</span>
          </div>
          <div className={styles.challengeScore}>
            <strong>5</strong>
            <span>questions</span>
          </div>
          <p>A short quiz is the easiest way to keep your momentum going.</p>
          <div className={styles.challengeMeta}>
            <span>{displayClass || 'Choose a class'}</span>
            <span>5 min</span>
          </div>
          <span className={styles.challengeAction}>Start challenge →</span>
        </button>

        <div className={styles.heroAccent} />
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.purpleIcon}`} aria-hidden>
            Q
          </span>
          <div className={styles.statContent}>
            <p>Available questions</p>
            <strong>{totalQuestions}</strong>
            <small>Ready for your next quiz</small>
          </div>
        </article>
        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.blueIcon}`} aria-hidden>
            S
          </span>
          <div className={styles.statContent}>
            <p>Available subjects</p>
            <strong>{totalSubjects}</strong>
            <small>Choose a topic to practice</small>
          </div>
        </article>
        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.greenIcon}`} aria-hidden>
            C
          </span>
          <div className={styles.statContent}>
            <p>{displayClass ? 'Selected class' : 'Available classes'}</p>
            <strong>{displayClass || totalQuizzes}</strong>
            <small>
              {displayClass
                ? `${totalQuizzes} class categories available`
                : 'Choose your class to begin'}
            </small>
          </div>
        </article>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.subjectSection}>
          <div className={styles.sectionHeader}>
            <div>
              <span>Pick a direction</span>
              <h2>Explore subjects</h2>
            </div>
            <button type="button" onClick={() => onNavigate?.('bank')}>
              View question bank →
            </button>
          </div>

          <div className={styles.subjectGrid}>
            {displaySubjects.slice(0, 4).map((subject, index) => (
              <button
                key={subject}
                type="button"
                className={styles.subjectCard}
                onClick={() => onStartSubject?.(subject)}
              >
                <span className={styles.subjectIcon}>{subjectIcons[index]}</span>
                <strong>{subject}</strong>
                <small>Practice now</small>
                <span className={styles.subjectArrow} aria-hidden>→</span>
              </button>
            ))}
          </div>
        </section>

        <aside className={styles.quickPanel}>
          <span className={styles.quickEyebrow}>Your progress</span>
          <h2>Learning snapshot</h2>
          <div className={styles.progressSnapshot}>
            <div>
              <strong>{history.length}</strong>
              <span>Attempts</span>
            </div>
            <div>
              <strong>{Math.round(bestPercentage)}%</strong>
              <span>Best score</span>
            </div>
            <div>
              <strong>{latestResult ? `${Math.round(Number(latestResult.percentage) || 0)}%` : '-'}</strong>
              <span>Latest score</span>
            </div>
          </div>
          <button type="button" onClick={() => onNavigate?.('results')}>
            <span>Review your results</span><span aria-hidden>→</span>
          </button>
          <button type="button" onClick={() => onNavigate?.('profile')}>
            <span>View your progress</span><span aria-hidden>→</span>
          </button>
          <button type="button" onClick={() => onNavigate?.('bank')}>
            <span>Browse all questions</span><span aria-hidden>→</span>
          </button>
        </aside>
      </div>
    </section>
  );
}
