import { useState } from 'react';
import styles from './QuizFullScreen.module.css';
import useQuiz from '../hooks/useQuiz';

export default function QuizFullScreen(props) {
  const { questions = [] } = props;
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

  const q = questions[currentIndex];

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

  // If exam hasn't started, show start screen
  if (!hasStarted) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.centerCard}>
          <h2>Ready to start?</h2>
          <p>You have {totalQuestions} questions. Time limit: {props.durationMinutes} minutes.</p>
          <button type="button" className={styles.submitButton} onClick={startExam}>
            Start Exam
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <aside className={styles.leftColumn}>
        <div className={styles.timerBox}>
          <div className={styles.timerValue}>{minutes}:{String(seconds).padStart(2, '0')}</div>
          <div className={styles.timerLabel}>Time left</div>
        </div>

        <div className={styles.progressList}>
          {questions.map((qq, idx) => {
            // Before submission: only show answered vs skipped
            // After submission: show correct vs wrong
            let state = 'skipped';
            if (answers[qq.id]) {
              state = submitted ? (answers[qq.id] === qq.correct_answer ? 'correct' : 'wrong') : 'answered';
            }
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={qq.id}
                type="button"
                className={`${styles.progressDot} ${styles[state]} ${isCurrent ? styles.currentDot : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className={styles.summaryBox}>
          <div>Answered: {answeredCount}/{totalQuestions}</div>
          <div>Skipped: {totalQuestions - answeredCount}</div>
        </div>
      </aside>

      <main className={styles.centerColumn}>
        <div className={styles.questionHeader}>
          <div>
            <h3 className={styles.questionTitle}>Question {currentIndex + 1} of {totalQuestions}</h3>
            <div className={styles.questionText}>{q.question_text}</div>
          </div>
          <div className={styles.metaSmall}>{q.subject || props.subject}</div>
        </div>

        <div role="radiogroup" aria-label={`Options for question ${currentIndex + 1}`} className={styles.optionsGrid}>
          {['A', 'B', 'C', 'D'].map((opt) => {
            const text = q[`option_${opt.toLowerCase()}`];
            const selected = answers[q.id] === opt;
            // After submission, show correct answer highlight
            const isCorrect = submitted && q.correct_answer === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Option ${opt}: ${text}`}
                className={`${styles.optionCard} ${selected ? styles.selected : ''} ${isCorrect ? styles.correct : ''}`}
                onClick={() => selectAnswer(q.id, opt)}
                disabled={submitted}
              >
                <div className={styles.optionKey}>{opt}</div>
                <div className={styles.optionText}>{text}</div>
              </button>
            );
          })}
        </div>

        <div className={styles.centerActions}>
          <button type="button" className={styles.navButton} onClick={handlePrevious} disabled={currentIndex === 0}>Previous</button>
          {currentIndex < totalQuestions - 1 ? (
            <button type="button" className={styles.navButton} onClick={handleNext}>Next</button>
          ) : (
            <button type="button" className={styles.submitButton} onClick={() => setConfirmOpen(true)}>Submit Exam</button>
          )}
        </div>

        <div className="sr-only" aria-live="polite">{timeAnnouncement}</div>
      </main>

      <aside className={styles.rightColumn}>
        <div className={styles.tilesGrid}>
          {questions.map((qq, idx) => (
            <button key={qq.id} type="button" className={styles.tile} onClick={() => setCurrentIndex(idx)} aria-label={`Jump to question ${idx + 1}`}>
              {idx + 1}
            </button>
          ))}
        </div>

        <div className={styles.submitWrap}>
          <button type="button" className={styles.submitButton} onClick={() => setConfirmOpen(true)}>Submit Exam</button>
        </div>
      </aside>

      {confirmOpen && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true">
          <div className={styles.confirmBox}>
            <h4>Submit exam?</h4>
            <p>Are you sure you want to submit your answers? This will end the exam.</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button type="button" className={styles.primaryButton} onClick={handleSubmit}>Yes, submit</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
