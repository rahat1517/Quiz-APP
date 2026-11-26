import styles from './Hero.module.css';
import { Button } from './ui/Button';
import { formatClassLevel } from '../lib/normalizeClassLevel';

// Compact home screen: a one-line greeting, a small progress strip and the
// subject list. Tapping a subject opens the quiz setup for it; everything
// else is one tap away in the tab bar.
export default function Hero({
  totalQuestions,
  userName = 'Learner',
  classLabel,
  subjects = [],
  history = [],
  onStartSubject,
}) {
  const firstName = String(userName).trim().split(/\s+/)[0] || 'Learner';
  const displayClass = classLabel ? formatClassLevel(classLabel) : null;
  const bestPercentage = history.reduce(
    (best, item) => Math.max(best, Number(item.percentage) || 0),
    0
  );
  const latestResult = history[0];

  return (
    <section className={styles.home}>
      <header className={styles.greeting}>
        <h1>Hi, {firstName}</h1>
        <p>
          {displayClass ? `${displayClass}, ` : ''}
          {totalQuestions} question{totalQuestions === 1 ? '' : 's'} ready
        </p>
      </header>

      <dl className={styles.progress} aria-label="Your progress">
        <div>
          <dt>Quizzes taken</dt>
          <dd>{history.length}</dd>
        </div>
        <div>
          <dt>Best score</dt>
          <dd>{history.length ? `${Math.round(bestPercentage)}%` : '–'}</dd>
        </div>
        <div>
          <dt>Last score</dt>
          <dd>
            {latestResult ? `${Math.round(Number(latestResult.percentage) || 0)}%` : '–'}
          </dd>
        </div>
      </dl>

      <section className={styles.subjects} aria-labelledby="home-subjects">
        <h2 id="home-subjects">Practice a subject</h2>
        {subjects.length === 0 ? (
          <p className={styles.empty}>No questions yet for your class.</p>
        ) : (
          <div className={styles.subjectList}>
            {subjects.map((subject) => (
              <Button
                key={subject}
                type="button"
                className={styles.subjectItem}
                onClick={() => onStartSubject?.(subject)}
              >
                <span>{subject}</span>
                <span className={styles.chevron} aria-hidden>›</span>
              </Button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
