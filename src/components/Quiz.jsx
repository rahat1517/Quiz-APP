import { useEffect, useMemo, useState } from 'react';
import styles from './Quiz.module.css';

const QUIZ_TIME = 90;

export default function Quiz({ questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);

  const currentQuestion = questions[currentIndex];

  const result = useMemo(() => {
    const correctAnswers = questions.reduce((total, question) => {
      return answers[question.id] === question.correct_answer ? total + 1 : total;
    }, 0);
    const totalQuestions = questions.length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return {
      score: correctAnswers,
      total: totalQuestions,
      correct: correctAnswers,
      wrong: wrongAnswers,
      percentage,
      subject: questions[0]?.subject || 'General',
      answers,
    };
  }, [answers, questions]);

  const answeredCount = Object.keys(answers).length;
  const currentScore = questions.reduce((total, question) => {
    if (!answers[question.id]) return total;
    return answers[question.id] === question.correct_answer ? total + 1 : total;
  }, 0);

  useEffect(() => {
    if (submitted || questions.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setSubmitted(true);
          onComplete?.(result);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [submitted, questions.length, onComplete, result]);

  function handleAnswer(answer) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  }

  function handleSubmit() {
    setSubmitted(true);
    onComplete?.(result);
  }

  function handlePrevious() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }

  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (questions.length === 0) {
    return (
      <section className={styles.quizWrapper}>
        <h2>Start Quiz</h2>
        <p className={styles.emptyState}>Your quiz bank is empty. Add questions to begin.</p>
      </section>
    );
  }

  return (
    <section className={styles.quizWrapper}>
      <div className={styles.quizHeader}>
        <div>
          <h2>Quiz Mode</h2>
          <p className={styles.timer}>Time left: {minutes}:{seconds.toString().padStart(2, '0')}</p>
          <p className={styles.timer}>
            Marks: {currentScore} / {questions.length}
          </p>
          <p className={styles.timer}>
            Answered: {answeredCount} / {questions.length}
          </p>
        </div>
        <div className={styles.timer}>Question {currentIndex + 1} of {questions.length}</div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <h3>{currentQuestion.question_text}</h3>
          <span className={styles.timer}>Subject: {currentQuestion.subject || 'General'}</span>
        </div>

        <div className={styles.optionsGrid}>
          {['A', 'B', 'C', 'D'].map((optionKey) => {
            const optionText = currentQuestion[`option_${optionKey.toLowerCase()}`];
            const selected = answers[currentQuestion.id] === optionKey;
            return (
              <label key={optionKey} className={selected ? `${styles.optionItem} ${styles.selected}` : styles.optionItem}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={optionKey}
                  checked={selected}
                  onChange={() => handleAnswer(optionKey)}
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
