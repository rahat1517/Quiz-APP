import { useState } from 'react';
import { Zap, SlidersHorizontal, ArrowLeft, Shuffle } from 'lucide-react';
import { Button } from './ui/Button';
import { subjectIcon } from '../lib/subjectIcons';
import styles from './QuizSetup.module.css';

const QUICK = { questionCount: '5', timeLimit: '5' };
const ALL = 'All Subjects';

function Stepper({ id, label, value, onChange, min, max, unit, hint }) {
  const clamp = (n) => String(Math.min(max, Math.max(min, Number.isInteger(n) ? n : min)));
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>{label}</label>
      <div className={styles.stepper}>
        <Button type="button" onClick={() => onChange(clamp((Number(value) || min) - 1))} aria-label={`Decrease ${label.toLowerCase()}`}>
          −
        </Button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onChange(clamp(Number(value)))}
          aria-describedby={`${id}-hint`}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
        <Button type="button" onClick={() => onChange(clamp((Number(value) || 0) + 1))} aria-label={`Increase ${label.toLowerCase()}`}>
          +
        </Button>
      </div>
      <small id={`${id}-hint`} className={styles.hint}>{hint}</small>
    </div>
  );
}

/**
 * Quiz setup: Quick practice starts a 5-question, 5-minute quiz from one tap;
 * Custom quiz picks a topic, then chapter, length and time.
 */
export default function QuizSetup({
  subjects = [],
  questionCounts = {},
  bestBySubject = {},
  chapters = [],
  classOptions = [],
  selectedClass,
  isClassRestricted,
  onClassChange,
  formatClass = (c) => c,
  selectedChapter,
  onChapterChange,
  questionCount,
  onQuestionCountChange,
  timeLimit,
  onTimeLimitChange,
  onSubjectChange,
  onQuickStart,
  onStart,
  loading,
  error,
}) {
  const [mode, setMode] = useState('quick');
  const [picked, setPicked] = useState(null);
  const [pending, setPending] = useState(null);
  const total = Object.values(questionCounts).reduce((sum, n) => sum + n, 0);
  const topics = [ALL, ...subjects];

  function chooseTopic(subject) {
    onSubjectChange(subject);
    if (mode === 'quick') {
      setPending(subject);
      onQuickStart(subject, QUICK);
    } else {
      setPicked(subject);
    }
  }

  const tabs = [
    { id: 'quick', label: 'Quick practice', Icon: Zap },
    { id: 'custom', label: 'Custom quiz', Icon: SlidersHorizontal },
  ];

  return (
    <section className={styles.setup}>
      <div className={styles.modeSwitch} role="tablist" aria-label="Quiz type">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? `${styles.modeTab} ${styles.modeActive}` : styles.modeTab}
            onClick={() => {
              setMode(id);
              setPicked(null);
            }}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {picked === null ? (
        <>
          <div className={styles.listHeader}>
            <div>
              <h2 className={styles.title}>Select a topic</h2>
              <p className={styles.subtitle}>
                {mode === 'quick'
                  ? 'Tap a topic to start 5 questions in 5 minutes.'
                  : 'Pick a topic, then choose the chapter, length and time.'}
              </p>
            </div>
            {!isClassRestricted && classOptions.length > 0 && (
              <label className={styles.classPicker}>
                <span className="sr-only">Class or exam</span>
                <select value={selectedClass} onChange={(event) => onClassChange(event.target.value)}>
                  {classOptions.map((level) => (
                    <option key={level} value={level}>
                      {formatClass(level)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {subjects.length === 0 ? (
            <p className={styles.empty}>No questions yet for this class.</p>
          ) : (
            <div className={styles.topicGrid}>
              {topics.map((subject) => {
                const isAll = subject === ALL;
                const { Icon, tint } = isAll ? { Icon: Shuffle, tint: 'blue' } : subjectIcon(subject);
                const count = isAll ? total : questionCounts[subject] || 0;
                const best = isAll ? null : bestBySubject[subject];
                const busy = loading && pending === subject;
                return (
                  <Button
                    key={subject}
                    type="button"
                    className={styles.topic}
                    onClick={() => chooseTopic(subject)}
                    disabled={loading}
                    aria-label={`${isAll ? 'All subjects' : subject}, ${count} questions${best != null ? `, best score ${best}%` : ''}`}
                  >
                    <span className={`${styles.topicIcon} ${styles[tint]}`} aria-hidden>
                      <Icon size={18} strokeWidth={2.2} />
                    </span>
                    <span className={styles.topicText}>
                      <strong>{isAll ? 'All subjects' : subject}</strong>
                      <small>{busy ? 'Loading questions…' : `${count} question${count === 1 ? '' : 's'}`}</small>
                    </span>
                    {best != null && <span className={styles.topicBest}>{best}%</span>}
                    {best != null && (
                      <span className={styles.topicProgress} aria-hidden>
                        <span style={{ width: `${best}%` }} />
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className={styles.customPanel}>
          <Button type="button" className={styles.back} onClick={() => setPicked(null)}>
            <ArrowLeft size={16} aria-hidden /> All topics
          </Button>
          <h2 className={styles.title}>{picked === ALL ? 'All subjects' : picked}</h2>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="setup-chapter" className={styles.fieldLabel}>Chapter</label>
              <select
                id="setup-chapter"
                className={styles.select}
                value={selectedChapter}
                onChange={(event) => onChapterChange(event.target.value)}
              >
                {chapters.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>
            <Stepper
              id="quiz-count"
              label="Questions"
              value={questionCount}
              onChange={onQuestionCountChange}
              min={1}
              max={100}
              hint="Between 1 and 100."
            />
            <Stepper
              id="quiz-time"
              label="Time limit"
              value={timeLimit}
              onChange={onTimeLimitChange}
              min={1}
              max={180}
              unit="min"
              hint="Between 1 and 180 minutes."
            />
          </div>

          <Button type="button" className={styles.start} onClick={() => onStart()} disabled={loading}>
            {loading ? 'Loading questions…' : 'Start quiz'}
          </Button>
        </div>
      )}
    </section>
  );
}
