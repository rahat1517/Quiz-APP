import { BookOpen, ClipboardList, ChartColumn, UserRound, Lock, Inbox, Check } from 'lucide-react';
import styles from './Hero.module.css';
import { Button } from './ui/Button';
import { formatClassLevel } from '../lib/normalizeClassLevel';
import { quizStats } from '../lib/quizStats';

const REPORT_UNLOCK = 3;

const QUICK_ACTIONS = [
  { id: 'bank', label: 'Question Bank', Icon: BookOpen, tint: 'orange' },
  { id: 'quiz', label: 'Take a quiz', Icon: ClipboardList, tint: 'rose' },
  { id: 'results', label: 'Results', Icon: ChartColumn, tint: 'teal' },
  { id: 'profile', label: 'Profile', Icon: UserRound, tint: 'violet' },
];

function shortDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function Hero({
  totalQuestions,
  classLabel,
  subjects = [],
  history = [],
  onNavigate,
  onStartSubject,
}) {
  const stats = quizStats(history);
  const displayClass = classLabel ? formatClassLevel(classLabel) : null;
  const recent = history.slice(0, 3);

  const steps = [
    { label: 'Choose your class', done: Boolean(displayClass) },
    { label: 'Take your first quiz', done: stats.attempts >= 1 },
    { label: `Take ${REPORT_UNLOCK} quizzes`, done: stats.attempts >= REPORT_UNLOCK },
    { label: 'Score 80% or more', done: stats.best >= 80 },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const setupPercent = Math.round((doneCount / steps.length) * 100);

  return (
    <div className={styles.dashboard}>
      <div className={styles.mainColumn}>
        <nav className={`${styles.card} ${styles.quickActions}`} aria-label="Quick actions">
          {QUICK_ACTIONS.map(({ id, label, Icon, tint }) => (
            <Button key={id} type="button" className={styles.action} onClick={() => onNavigate?.(id)}>
              <span className={`${styles.actionIcon} ${styles[tint]}`} aria-hidden>
                <Icon size={24} strokeWidth={2.1} />
              </span>
              <span>{label}</span>
            </Button>
          ))}
        </nav>

        <div className={styles.cardRow}>
          <section className={styles.card} aria-labelledby="report-title">
            <h2 id="report-title" className={styles.cardTitle}>Your report</h2>
            {stats.attempts >= REPORT_UNLOCK ? (
              <dl className={styles.reportStats}>
                <div>
                  <dt>Average</dt>
                  <dd>{stats.average}%</dd>
                </div>
                <div>
                  <dt>Best</dt>
                  <dd>{stats.best}%</dd>
                </div>
                <div>
                  <dt>Quizzes</dt>
                  <dd>{stats.attempts}</dd>
                </div>
              </dl>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon} aria-hidden>
                  <Lock size={22} />
                </span>
                <p className={styles.emptyTitle}>Unlocks after {REPORT_UNLOCK} quizzes</p>
                <p className={styles.emptyText}>
                  {REPORT_UNLOCK - stats.attempts} more to go
                </p>
              </div>
            )}
          </section>

          <section className={styles.card} aria-labelledby="recent-title">
            <div className={styles.cardHeader}>
              <h2 id="recent-title" className={styles.cardTitle}>Recent quizzes</h2>
              {recent.length > 0 && (
                <Button type="button" className={styles.linkButton} onClick={() => onNavigate?.('results')}>
                  See all
                </Button>
              )}
            </div>
            {recent.length > 0 ? (
              <ul className={styles.recentList}>
                {recent.map((exam) => (
                  <li key={exam.id}>
                    <span className={styles.recentSubject}>{exam.subject || 'Mixed'}</span>
                    <span className={styles.recentDate}>{shortDate(exam.created_at)}</span>
                    <span className={styles.recentScore}>{Math.round(Number(exam.percentage) || 0)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon} aria-hidden>
                  <Inbox size={22} />
                </span>
                <p className={styles.emptyTitle}>No quizzes yet</p>
                <p className={styles.emptyText}>Your finished quizzes show up here.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className={styles.sideColumn}>
        <section className={styles.card} aria-labelledby="setup-title">
          <h2 id="setup-title" className={styles.cardTitle}>Get started</h2>
          <div
            className={styles.setupBar}
            role="progressbar"
            aria-valuenow={setupPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
          >
            <span style={{ width: `${setupPercent}%` }} />
          </div>
          <p className={styles.setupCaption}>
            {doneCount} of {steps.length} done
          </p>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.label} className={step.done ? styles.stepDone : undefined}>
                <span className={styles.stepMark} aria-hidden>
                  {step.done && <Check size={14} strokeWidth={3} />}
                </span>
                <span>{step.label}</span>
                <span className="sr-only">{step.done ? ' (done)' : ' (to do)'}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.card} aria-labelledby="subjects-title">
          <div className={styles.cardHeader}>
            <h2 id="subjects-title" className={styles.cardTitle}>Practice a subject</h2>
            <span className={styles.cardMeta}>
              {totalQuestions} question{totalQuestions === 1 ? '' : 's'}
            </span>
          </div>
          {subjects.length === 0 ? (
            <p className={styles.emptyText}>No questions yet for your class.</p>
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
      </div>
    </div>
  );
}
