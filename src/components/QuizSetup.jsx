import { useState } from 'react';
import { Zap, SlidersHorizontal, ArrowLeft, Shuffle, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { subjectIcon } from '../lib/subjectIcons';
import styles from './QuizSetup.module.css';

const QUICK = { questionCount: '5', timeLimit: '5' };
const ALL = 'All Subjects';

function Stepper({ id, label, value, onChange, min, max, unit, hint }) {
  // hint is optional; without it the stepper fits the compact bottom bar.
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
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
        <Button type="button" onClick={() => onChange(clamp((Number(value) || 0) + 1))} aria-label={`Increase ${label.toLowerCase()}`}>
          +
        </Button>
      </div>
      {hint && <small id={`${id}-hint`} className={styles.hint}>{hint}</small>}
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
  chapterCounts = {},
  classOptions = [],
  selectedClass,
  isClassRestricted,
  onClassChange,
  formatClass = (c) => c,
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
  // Chapters ticked on the setup page; empty means every chapter.
  const [ticked, setTicked] = useState([]);
  const total = Object.values(questionCounts).reduce((sum, n) => sum + n, 0);
  const topics = [ALL, ...subjects];

  function chooseTopic(subject) {
    onSubjectChange(subject);
    if (mode === 'quick') {
      setPending(subject);
      onQuickStart(subject, QUICK);
    } else {
      setTicked([]);
      setPicked(subject);
    }
  }

  const chapterNames = picked && picked !== ALL ? chapters.filter((c) => c !== 'All Chapters') : [];
  const chapterTotal = chapterNames.reduce((sum, c) => sum + (chapterCounts[c] || 0), 0);
  const pickedTotal =
    picked === ALL
      ? total
      : ticked.length
        ? ticked.reduce((sum, c) => sum + (chapterCounts[c] || 0), 0)
        : questionCounts[picked] || chapterTotal;

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
          <div className={styles.panelHeader}>
            <Button type="button" className={styles.back} onClick={() => setPicked(null)} aria-label="Back to topics">
              <ArrowLeft size={18} aria-hidden />
            </Button>
            <h2 className={styles.title}>{picked === ALL ? 'All subjects' : picked}</h2>
            <span className={styles.panelCount}>
              {pickedTotal} question{pickedTotal === 1 ? '' : 's'}
            </span>
          </div>

          {chapterNames.length > 0 && (
            <fieldset className={styles.chapterList}>
              <legend className={styles.listLegend}>Chapters</legend>
              <label className={`${styles.chapterRow} ${ticked.length === 0 ? styles.rowOn : ''}`}>
                <input
                  type="checkbox"
                  checked={ticked.length === 0}
                  onChange={() => setTicked([])}
                />
                <span className={styles.box} aria-hidden><Check size={14} strokeWidth={3} /></span>
                <span className={styles.chapterName}>All chapters</span>
                <span className={styles.chapterCount}>{chapterTotal}</span>
              </label>
              {chapterNames.map((chapter) => {
                const on = ticked.includes(chapter);
                return (
                  <label key={chapter} className={`${styles.chapterRow} ${on ? styles.rowOn : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setTicked((list) => (on ? list.filter((c) => c !== chapter) : [...list, chapter]))
                      }
                    />
                    <span className={styles.box} aria-hidden><Check size={14} strokeWidth={3} /></span>
                    <span className={styles.chapterName}>{chapter}</span>
                    <span className={styles.chapterCount}>{chapterCounts[chapter] || 0}</span>
                  </label>
                );
              })}
            </fieldset>
          )}

          <div className={styles.setupBar}>
            <div className={styles.barFields}>
              <Stepper
                id="quiz-count"
                label="Questions"
                value={questionCount}
                onChange={onQuestionCountChange}
                min={1}
                max={100}
              />
              <Stepper
                id="quiz-time"
                label="Time"
                value={timeLimit}
                onChange={onTimeLimitChange}
                min={1}
                max={180}
                unit="min"
              />
            </div>
            <Button
              type="button"
              className={styles.start}
              onClick={() => onStart({ chapters: ticked })}
              disabled={loading}
            >
              {loading ? 'Loading questions…' : 'Start quiz'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
