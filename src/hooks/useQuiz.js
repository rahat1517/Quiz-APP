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

  const clearPersistence = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Silently ignore storage errors
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      // Silently ignore storage errors
    }
  }, [answers, storageKey]);

  const result = useMemo(() => {
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skipped = 0;

    const answerDetails = questions.map((question) => {
      const userAnswer = answers[question.id];

      let status = 'skipped';

      if (!userAnswer) {
        skipped = skipped + 1;
      } else if (userAnswer === question.correct_answer) {
        correctAnswers = correctAnswers + 1;
        status = 'correct';
      } else {
        wrongAnswers = wrongAnswers + 1;
        status = 'wrong';
      }

      const userAnswerKey = String(userAnswer || '').toLowerCase();
      const correctAnswerKey = String(question.correct_answer || '').toLowerCase();

      return {
        question_id: question.id,

        question: question.question_text || question.question || '',

        options: [
          {
            key: 'A',
            text: question.option_a || '',
          },
          {
            key: 'B',
            text: question.option_b || '',
          },
          {
            key: 'C',
            text: question.option_c || '',
          },
          {
            key: 'D',
            text: question.option_d || '',
          },
        ],

        user_answer: userAnswer || null,
        user_answer_text: userAnswer
          ? question[`option_${userAnswerKey}`] || null
          : null,

        correct_answer: question.correct_answer || null,
        correct_answer_text: correctAnswerKey
          ? question[`option_${correctAnswerKey}`] || null
          : null,
        explanation: question.explanation || question.answer_explanation || '',
        status,
      };
    });

    const calculatedTotal = correctAnswers + wrongAnswers + skipped;

    if (calculatedTotal !== totalQuestions && totalQuestions > 0) {
      console.warn(
        `Quiz math error: ${correctAnswers} (correct) + ${wrongAnswers} (wrong) + ${skipped} (skipped) = ${calculatedTotal}, expected ${totalQuestions}`
      );
    }

    const percentage =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

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
      answers: answerDetails,
    };
  }, [
    answers,
    questions,
    totalQuestions,
    subject,
    classLevel,
    questionLimit,
    durationMinutes,
  ]);

  useEffect(() => {
    if (submitted || totalQuestions === 0 || !hasStarted) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setSubmitted(true);
          clearPersistence();
          onComplete?.(result);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    submitted,
    totalQuestions,
    onComplete,
    result,
    hasStarted,
    clearPersistence,
  ]);

  const answeredCount = Object.keys(answers).length;

  const selectAnswer = useCallback(
    (qid, key) => {
      setAnswers((prev) => ({ ...prev, [qid]: key }));

      if (!hasStarted) {
        setHasStarted(true);
      }
    },
    [hasStarted]
  );

  const startExam = useCallback(() => {
    setHasStarted(true);
  }, []);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    clearPersistence();
    onComplete?.(result);
  }, [clearPersistence, onComplete, result]);

  const handleNext = useCallback(
    () => setCurrentIndex((n) => Math.min(totalQuestions - 1, n + 1)),
    [totalQuestions]
  );

  const handlePrevious = useCallback(
    () => setCurrentIndex((n) => Math.max(0, n - 1)),
    []
  );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const timeAnnouncement = `${minutes} minute${
    minutes !== 1 ? 's' : ''
  } ${seconds} second${seconds !== 1 ? 's' : ''} remaining`;

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