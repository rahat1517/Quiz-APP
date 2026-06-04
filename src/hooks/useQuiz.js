import { useCallback, useEffect, useMemo, useState } from 'react';

export default function useQuiz({
  questions = [],
  durationMinutes = 5,
  questionLimit = questions.length,
  subject = 'General',
  classLevel = '6',
  onComplete,
  storageKey = 'quiz_answers',
} = {}) {
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [submitted, setSubmitted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      // Silently ignore storage errors
    }
  }, [answers, storageKey]);

  const result = useMemo(() => {
    const correctAnswers = questions.reduce((total, question) => {
      return answers[question.id] === question.correct_answer ? total + 1 : total;
    }, 0);
    const totalAnswered = Object.keys(answers).length;
    const wrongAnswers = totalAnswered - correctAnswers;
    const skipped = totalQuestions - totalAnswered;

    // Verify: correct + wrong + skipped should equal total
    const calculatedTotal = correctAnswers + wrongAnswers + skipped;
    if (calculatedTotal !== totalQuestions && totalQuestions > 0) {
      console.warn(
        `Quiz math error: ${correctAnswers} (correct) + ${wrongAnswers} (wrong) + ${skipped} (skipped) = ${calculatedTotal}, expected ${totalQuestions}`
      );
    }

    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return {
      score: correctAnswers,
      total: totalQuestions,
      correct: correctAnswers,
      wrong: wrongAnswers,
      skipped,
      percentage,
      subject,
      class_level: classLevel,
      question_limit: questionLimit,
      duration_minutes: durationMinutes,
      answers,
    };
  }, [answers, questions, totalQuestions, subject, classLevel, questionLimit, durationMinutes]);

  useEffect(() => {
    if (submitted || totalQuestions === 0 || !hasStarted) return undefined;

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
  }, [submitted, totalQuestions, onComplete, result, hasStarted]);

  const answeredCount = Object.keys(answers).length;

  const selectAnswer = useCallback((qid, key) => {
    setAnswers((prev) => ({ ...prev, [qid]: key }));
    // Auto-start exam on first answer if not started
    if (!hasStarted) {
      setHasStarted(true);
    }
  }, [hasStarted]);

  const startExam = useCallback(() => {
    setHasStarted(true);
  }, []);

  const clearPersistence = useCallback(() => {
    try { 
      sessionStorage.removeItem(storageKey); 
    } catch {
      // Silently ignore storage errors
    }
  }, [storageKey]);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    clearPersistence();
    onComplete?.(result);
  }, [clearPersistence, onComplete, result]);

  const handleNext = useCallback(() => setCurrentIndex((n) => Math.min(totalQuestions - 1, n + 1)), [totalQuestions]);
  const handlePrevious = useCallback(() => setCurrentIndex((n) => Math.max(0, n - 1)), []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const timeAnnouncement = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''} remaining`;

  return {
    currentIndex,
    setCurrentIndex,
    answers,
    selectAnswer,
    submitted,
    setSubmitted,
    hasStarted,
    startExam,
    timeLeft,
    minutes,
    seconds,
    timeAnnouncement,
    result,
    answeredCount,
    handleSubmit,
    handleNext,
    handlePrevious,
    clearPersistence,
  };
}
