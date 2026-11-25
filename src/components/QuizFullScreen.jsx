import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';
import ConfirmDialog from './ConfirmDialog';
import styles from './QuizFullScreen.module.css';
import useQuiz from '../hooks/useQuiz';
import { formatClassLevel } from '../lib/normalizeClassLevel';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export default function QuizFullScreen(props) {
  const { questions = [], onProgressChange } = props;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const optionRefs = useRef([]);

  const {
    currentIndex,
    setCurrentIndex,
    answers,
    selectAnswer,
    submitted,
    hasStarted,
    startExam,
    minutes,
    seconds,
    timeAnnouncement,
    timeLeft,
    answeredCount,
    handleSubmit,
    handleNext,
    handlePrevious,
  } = useQuiz(props);

  const totalQuestions = questions.length;
  const inProgress = hasStarted && !submitted;

  // Let the parent know when an attempt is underway so it can warn before
  // navigation throws the attempt away.
  useEffect(() => {
    onProgressChange?.(inProgress);
  }, [inProgress, onProgressChange]);

  useEffect(() => () => onProgressChange?.(false), [onProgressChange]);
  const q = questions[currentIndex];
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const completion = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const classLabel = formatClassLevel(props.classLevel) || 'Your class';

  const currentExplanation = q?.explanation || q?.answer_explanation || '';
  const timeLow = timeLeft <= 60;
  const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;

  function renderQuestionDots(className) {
    return (
      <div className={className}>
        {questions.map((qq, idx) => {
          let state = 'skipped';

          if (answers[qq.id]) {
            state = submitted
              ? answers[qq.id] === qq.correct_answer
                ? 'correct'
                : 'wrong'
              : 'answered';
          }

          const isCurrent = idx === currentIndex;

          return (
            <Button
              key={qq.id}
              type="button"
              className={`${styles.progressDot} ${styles[state]} ${
                isCurrent ? styles.currentDot : ''
              }`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Question ${idx + 1}${answers[qq.id] ? ', answered' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {idx + 1}
            </Button>
          );
        })}
      </div>
    );
  }

  // Radio-group keyboard pattern: arrows move between options and select them,
  // and only one option is a Tab stop.
  function handleOptionKeyDown(event, index) {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next = null;

    if (event.key in keys) next = (index + keys[event.key] + 4) % 4;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 3;
    if (next === null || submitted) return;

    event.preventDefault();
    selectAnswer(q.id, OPTION_KEYS[next]);
    optionRefs.current[next]?.focus();
  }

  const submitButton = (
    <Button
      type="button"
      className={styles.submitButton}
      onClick={() => setConfirmOpen(true)}
    >
      Submit exam
    </Button>
  );

  if (totalQuestions === 0) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.centerCard}>
          <h2>No questions available</h2>
          <p className={styles.empty}>Add questions to begin the exam.</p>
        </div>
      </section>
    );
  }

  if (!hasStarted) {
    return (
      <section className={styles.startScreen}>
        <div className={styles.startCard}>
          <span className={styles.startBadge}>Quiz ready</span>
          <div className={styles.startIcon}>Q</div>
          <h2>Ready to challenge yourself?</h2>
          <p>Stay focused, choose your best answer, and learn from the result.</p>
          <div className={styles.startStats}>
            <div><strong>{totalQuestions}</strong><span>Questions</span></div>
            <div><strong>{props.durationMinutes}</strong><span>Minutes</span></div>
            <div><strong>{props.subject || 'Mixed'}</strong><span>Subject</span></div>
          </div>
          <p className={styles.startClass}>{classLabel}</p>
          <div className={styles.startActions}>
            <Button
              type="button"
              className={styles.backButton}
              onClick={props.onBackToSetup}
            >
              ← Back to setup
            </Button>
            <Button
              type="button"
              className={styles.startButton}
              onClick={startExam}
            >
              Start Exam <span aria-hidden>→</span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <aside className={styles.leftColumn}>
        <div className={`${styles.timerBox} ${timeLow ? styles.timeLow : ''}`}>
          <span className={styles.timerIcon} aria-hidden>◷</span>
          <div className={styles.timerValue}>{timeText}</div>
          <div className={styles.timerLabel}>Time left</div>
        </div>

        <div className={styles.sideHeading}>
          <span>Answered</span>
          <strong>{answeredCount}/{totalQuestions}</strong>
        </div>

        <nav aria-label="Jump to question">
          {renderQuestionDots(styles.progressList)}
        </nav>

        {submitButton}
      </aside>

      <main className={styles.centerColumn}>
        <div className={styles.mobileStatus}>
          <div className={styles.mobileStatusRow}>
            <span>
              Question {currentIndex + 1}/{totalQuestions} · {answeredCount} answered
            </span>
            <strong className={timeLow ? styles.timeLowText : ''}>{timeText}</strong>
          </div>
          <div className={styles.mobileProgress}>
            <span style={{ width: `${completion}%` }} />
          </div>
          <nav aria-label="Jump to question" className={styles.mobileJump}>
            {renderQuestionDots(styles.mobileDots)}
            {submitButton}
          </nav>
        </div>

        <div className={styles.topProgress}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.questionHeader}>
          <div>
            <div className={styles.questionMeta}>
              <span className={styles.questionNumber}>Question {currentIndex + 1}</span>
              <span className={styles.metaSmall}>{q.subject || props.subject}</span>
              {q.chapter && <span className={styles.metaSmall}>{q.chapter}</span>}
            </div>

            <h3 className={styles.questionText}>{q.question_text}</h3>
          </div>
        </div>

        <p className={styles.answerHint}>Choose one answer</p>

        <div
          role="radiogroup"
          aria-label={`Options for question ${currentIndex + 1}`}
          className={styles.optionsGrid}
        >
          {OPTION_KEYS.map((opt, optIndex) => {
            const text = q[`option_${opt.toLowerCase()}`];
            const selected = answers[q.id] === opt;

            const isCorrect = submitted && q.correct_answer === opt;
            const isWrongSelected =
              submitted && selected && q.correct_answer !== opt;
            const currentAnswerIndex = OPTION_KEYS.indexOf(answers[q.id]);
            const isTabStop =
              currentAnswerIndex === -1 ? optIndex === 0 : optIndex === currentAnswerIndex;

            return (
              <Button
                key={opt}
                ref={(node) => {
                  optionRefs.current[optIndex] = node;
                }}
                type="button"
                role="radio"
                tabIndex={isTabStop ? 0 : -1}
                onKeyDown={(event) => handleOptionKeyDown(event, optIndex)}
                aria-checked={selected}
                aria-label={`Option ${opt}: ${text}`}
                className={`${styles.optionCard} ${
                  selected ? styles.selected : ''
                } ${isCorrect ? styles.correct : ''} ${
                  isWrongSelected ? styles.wrong : ''
                }`}
                onClick={() => selectAnswer(q.id, opt)}
                disabled={submitted}
              >
                <div className={styles.optionKey}>{opt}</div>
                <div className={styles.optionText}>{text}</div>
              </Button>
            );
          })}
        </div>

        {submitted && currentExplanation && (
          <div className={styles.explanationBox}>
            <div className={styles.explanationTitle}>Explanation</div>
            <p>{currentExplanation}</p>
          </div>
        )}

        <div className={styles.centerActions}>
          <Button
            type="button"
            className={styles.navButton}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <span aria-hidden>←</span> Previous
          </Button>

          {currentIndex < totalQuestions - 1 ? (
            <Button
              type="button"
              className={styles.navButton}
              onClick={handleNext}
            >
              Next <span aria-hidden>→</span>
            </Button>
          ) : (
            submitButton
          )}
        </div>

        <div className="sr-only" aria-live="polite">
          {timeAnnouncement}
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit exam?"
        description={`You answered ${answeredCount} of ${totalQuestions} questions. Submitting ends this attempt.`}
        confirmLabel="Yes, submit"
        onConfirm={() => {
          setConfirmOpen(false);
          handleSubmit();
        }}
      />
    </section>
  );
}
