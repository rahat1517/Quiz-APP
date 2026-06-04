import styles from './Quiz.module.css';
import useQuiz from '../hooks/useQuiz';

export default function Quiz(props) {
  const { questions = [], subject = 'General', classLevel = '6', durationMinutes = 5 } = props;
  const {
    currentIndex,
    answers,
    selectAnswer,
    submitted,
    hasStarted,
    startExam,
    minutes,
    seconds,
    result,
    answeredCount,
    handleSubmit,
    handleNext,
    handlePrevious,
  } = useQuiz({ ...props, subject, classLevel, durationMinutes });

  const currentQuestion = questions[currentIndex];
  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  if (questions.length === 0) {
    return (
      <section className={styles.quizWrapper}>
        <h2>Start Quiz</h2>
        <p className={styles.emptyState}>Your quiz bank is empty. Add questions to begin.</p>
      </section>
    );
  }

  if (!hasStarted) {
    return (
      <section className={styles.quizWrapper}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Ready to start?</h2>
          <p>You have {questions.length} questions. Time limit: {durationMinutes} minutes.</p>
          <button type="button" style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', marginTop: '1rem' }} onClick={startExam}>
            Start Quiz
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.quizWrapper}>
      <div className={styles.quizHeader}>
        <div>
          <h2>Quiz Mode</h2>
          <p className={styles.timer}>Class: {classLevel}</p>
          <p className={styles.timer}>Subject: {subject}</p>
          <p className={styles.timer}>Time left: {minutes}:{seconds.toString().padStart(2, '0')}</p>
          <p className={styles.timer}>Marks: {result.score} / {questions.length}</p>
          <p className={styles.timer}>Answered: {answeredCount} / {questions.length}</p>
          <p className={styles.timer}>Skipped: {questions.length - answeredCount}</p>
        </div>
        <div className={styles.timer}>Question {currentIndex + 1} of {questions.length}</div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>{currentQuestion.question_text}</h3>
            <small style={{ color: '#999' }}>#{currentIndex + 1}</small>
          </div>
          <span className={styles.timer}>Subject: {currentQuestion.subject || 'General'}</span>
        </div>

        <div className={styles.optionsGrid} role="radiogroup" aria-label={`Question ${currentIndex + 1} options`}>
          {['A', 'B', 'C', 'D'].map((optionKey) => {
            const optionText = currentQuestion[`option_${optionKey.toLowerCase()}`];
            const selected = answers[currentQuestion.id] === optionKey;
            return (
              <label
                key={optionKey}
                className={selected ? `${styles.optionItem} ${styles.selected}` : styles.optionItem}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={optionKey}
                  checked={selected}
                  onChange={() => selectAnswer(currentQuestion.id, optionKey)}
                  disabled={submitted}
                  hidden
                />
                <strong>{optionKey}</strong>
                <span>{optionText}</span>
              </label>
            );
          })}
        </div>

        <div className={styles.navigation}>
          <button type="button" className={styles.navButton} onClick={handlePrevious} disabled={currentIndex === 0}>
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button type="button" className={styles.navButton} onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="button" className={styles.submitButton} onClick={handleSubmit} disabled={submitted}>
              {submitted ? 'Submitted' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
