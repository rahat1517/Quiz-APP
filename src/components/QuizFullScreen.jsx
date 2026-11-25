import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import ConfirmDialog from './ConfirmDialog';
import styles from './QuizFullScreen.module.css';
import useQuiz from '../hooks/useQuiz';
import { formatClassLevel } from '../lib/normalizeClassLevel';

export default function QuizFullScreen(props) {
  const { questions = [], onProgressChange } = props;
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        <div className={styles.timerBox}>
          <span className={styles.timerIcon}>◷</span>
          <div className={styles.timerValue}>
            {minutes}:{String(seconds).padStart(2, '0')}
          </div>
          <div className={styles.timerLabel}>Time left</div>
        </div>

        <div className={styles.sideHeading}>
          <span>Questions</span>
          <strong>{answeredCount}/{totalQuestions}</strong>
        </div>

        <div className={styles.progressList}>
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
                aria-label={`Go to question ${idx + 1}`}
              >
                {idx + 1}
              </Button>
            );
          })}
        </div>

        <div className={styles.summaryBox}>
          <div><span>Answered</span><strong>{answeredCount}</strong></div>
          <div><span>Remaining</span><strong>{totalQuestions - answeredCount}</strong></div>
        </div>
      </aside>

      <main className={styles.centerColumn}>
        <div className={styles.mobileStatus}>
          <div>
            <span>Question {currentIndex + 1}/{totalQuestions}</span>
            <strong>{minutes}:{String(seconds).padStart(2, '0')}</strong>
          </div>
          <div className={styles.mobileProgress}>
            <span style={{ width: `${completion}%` }} />
          </div>
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
          {['A', 'B', 'C', 'D'].map((opt) => {
            const text = q[`option_${opt.toLowerCase()}`];
            const selected = answers[q.id] === opt;

            const isCorrect = submitted && q.correct_answer === opt;
            const isWrongSelected =
              submitted && selected && q.correct_answer !== opt;

            return (
              <Button
                key={opt}
                type="button"
                role="radio"
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
            <Button
              type="button"
              className={styles.submitButton}
              onClick={() => setConfirmOpen(true)}
            >
              Submit Exam
            </Button>
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
