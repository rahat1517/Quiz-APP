import { useEffect, useMemo, useState } from 'react';
import styles from './Result.module.css';

export default function Result({
  result,
  history = [],
  loading = false,
  error = '',
  onRestart,
}) {
  const [selectedExam, setSelectedExam] = useState(null);

  const displayedHistory = useMemo(() => {
    if (!result?.id) {
      return history;
    }

    return history.filter((exam) => exam.id !== result.id);
  }, [history, result?.id]);

  const latestResult = useMemo(() => {
    if (!result) return null;

    const totalQuestions = result.total ?? result.total_questions ?? 0;
    const correctAnswers = result.correct ?? result.correct_answers ?? 0;
    const wrongAnswers = result.wrong ?? result.wrong_answers ?? 0;
    const skippedAnswers =
      result.skipped ??
      result.skippedAnswers ??
      result.skipped_answers ??
      Number(totalQuestions) - Number(correctAnswers) - Number(wrongAnswers);

    return {
      ...result,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      skipped_answers: skippedAnswers,
      score: result.score ?? 0,
      percentage: result.percentage ?? 0,
      answers: result.answers,
    };
  }, [result]);

  useEffect(() => {
    if (!selectedExam) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSelectedExam(null);
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedExam]);

  function formatDate(dateValue) {
    if (!dateValue) return '-';

    return new Date(dateValue).toLocaleString('en-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function getAnswerList(exam) {
    if (!exam?.answers) return [];

    if (Array.isArray(exam.answers)) {
      return exam.answers;
    }

    try {
      const parsed = JSON.parse(exam.answers);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function getStatusClass(status) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'correct') return styles.correct;
    if (normalized === 'wrong') return styles.wrong;
    if (normalized === 'skipped') return styles.skipped;

    return styles.neutral;
  }

  function getStatusLabel(status) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'correct') return 'Correct';
    if (normalized === 'wrong') return 'Wrong';
    if (normalized === 'skipped') return 'Skipped';

    return 'Unknown';
  }

  function normalizeOptions(options) {
    if (!options) return [];

    if (Array.isArray(options)) {
      return options.map((option, index) => {
        if (typeof option === 'object' && option !== null) {
          return {
            key: String(option.key || String.fromCharCode(65 + index)).toUpperCase(),
            text: String(option.text || ''),
          };
        }

        return {
          key: String.fromCharCode(65 + index),
          text: String(option || ''),
        };
      });
    }

    if (typeof options === 'object') {
      return Object.entries(options).map(([key, value]) => ({
        key: String(key).toUpperCase(),
        text: String(value || ''),
      }));
    }

    return [
      {
        key: 'A',
        text: String(options),
      },
    ];
  }

  function getAnswerText(answer, answerKey) {
    if (!answerKey) return null;

    const options = normalizeOptions(answer.options);
    const found = options.find(
      (option) =>
        String(option.key).toUpperCase() === String(answerKey).toUpperCase()
    );

    return found?.text || null;
  }

  function getUserAnswerKey(answer) {
    return answer.user_answer || answer.selected_answer || null;
  }

  function getCorrectAnswerKey(answer) {
    return answer.correct_answer || answer.correctAnswer || null;
  }

  function getUserAnswerDisplay(answer) {
    const userKey = getUserAnswerKey(answer);

    if (!userKey) return 'Skipped';

    const userText =
      answer.user_answer_text ||
      answer.selected_answer_text ||
      getAnswerText(answer, userKey);

    return userText ? `${userKey} - ${userText}` : userKey;
  }

  function getCorrectAnswerDisplay(answer) {
    const correctKey = getCorrectAnswerKey(answer);

    if (!correctKey) return '-';

    const correctText =
      answer.correct_answer_text ||
      answer.correctAnswerText ||
      getAnswerText(answer, correctKey);

    return correctText ? `${correctKey} - ${correctText}` : correctKey;
  }

  function getExplanation(answer) {
    return (
      answer.explanation ||
      answer.answer_explanation ||
      answer.explanation_text ||
      ''
    );
  }

  function getOptionClass(answer, optionKey) {
    const userKey = getUserAnswerKey(answer);
    const correctKey = getCorrectAnswerKey(answer);
    const status = String(answer.status || '').toLowerCase();

    const isUserOption =
      userKey && String(userKey).toUpperCase() === String(optionKey).toUpperCase();

    const isCorrectOption =
      correctKey &&
      String(correctKey).toUpperCase() === String(optionKey).toUpperCase();

    if (isCorrectOption) {
      return styles.correctOption;
    }

    if (status === 'wrong' && isUserOption) {
      return styles.wrongOption;
    }

    return styles.normalOption;
  }

  const selectedExamAnswers = getAnswerList(selectedExam);
  const resultPercentage = Number(latestResult?.percentage) || 0;
  const performance =
    resultPercentage >= 85
      ? { label: 'Excellent work', message: 'You have a strong grasp of this quiz.', tone: styles.excellent }
      : resultPercentage >= 60
        ? { label: 'Good progress', message: 'A little review will make this even stronger.', tone: styles.good }
        : { label: 'Keep practicing', message: 'Review the answers and try again with confidence.', tone: styles.practice };

  return (
    <div className={styles.resultPage}>
      <div className={styles.headerRow}>
        <div>
          <span className={styles.pageEyebrow}>Performance center</span>
          <h2>Your quiz results</h2>
          <p>Understand your score, review answers, and keep improving.</p>
        </div>

        {onRestart && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onRestart}
          >
            Try another quiz <span aria-hidden>→</span>
          </button>
        )}
      </div>

      {latestResult && (
        <section className={styles.currentResultCard}>
          <div className={styles.resultHero}>
            <div
              className={`${styles.scoreRing} ${performance.tone}`}
              style={{ '--score': `${Math.min(100, Math.max(0, resultPercentage)) * 3.6}deg` }}
            >
              <div>
                <strong>{resultPercentage}%</strong>
                <span>Score</span>
              </div>
            </div>

            <div className={styles.resultMessage}>
              <span className={`${styles.performanceBadge} ${performance.tone}`}>
                {performance.label}
              </span>
              <h3>You scored {latestResult.score} out of {latestResult.total_questions}</h3>
              <p>{performance.message}</p>
              <button
                type="button"
                className={styles.reviewButton}
                onClick={() => setSelectedExam(latestResult)}
              >
                Review your answers <span aria-hidden>→</span>
              </button>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={`${styles.summaryBox} ${styles.correctBox}`}>
              <span className={styles.summaryIcon}>✓</span>
              <div><span>Correct</span><strong>{latestResult.correct_answers}</strong></div>
            </div>
            <div className={`${styles.summaryBox} ${styles.wrongBox}`}>
              <span className={styles.summaryIcon}>×</span>
              <div><span>Wrong</span><strong>{latestResult.wrong_answers}</strong></div>
            </div>
            <div className={`${styles.summaryBox} ${styles.skippedBox}`}>
              <span className={styles.summaryIcon}>−</span>
              <div><span>Skipped</span><strong>{latestResult.skipped_answers}</strong></div>
            </div>
          </div>
        </section>
      )}

      <section className={styles.historySection}>
        <div className={styles.sectionTitleRow}>
          <div>
            <span className={styles.pageEyebrow}>Your journey</span>
            <h3>Past Exams</h3>
            <p>Open any attempt to review each question and explanation.</p>
          </div>
          <span className={styles.historyCount}>{displayedHistory.length} attempts</span>
        </div>

        {loading && (
          <div className={styles.statusBox}>Loading past exams...</div>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        {!loading && !error && displayedHistory.length === 0 && (
          <div className={styles.statusBox}>No past exam result found.</div>
        )}

        {!loading && !error && displayedHistory.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.resultTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Total</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th>Skipped</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {displayedHistory.map((exam) => {
                  const isSelected = selectedExam?.id === exam.id;

                  return (
                    <tr
                      key={exam.id}
                      className={isSelected ? styles.selectedExamRow : ''}
                    >
                      <td data-label="Date">{formatDate(exam.created_at)}</td>

                      <td data-label="Class">
                        {exam.class_level ? `${exam.class_level}` : '-'}
                      </td>

                      <td data-label="Subject">{exam.subject || '-'}</td>

                      <td data-label="Total">{exam.total_questions ?? 0}</td>

                      <td data-label="Correct" className={styles.correctText}>
                        {exam.correct_answers ?? 0}
                      </td>

                      <td data-label="Wrong" className={styles.wrongText}>
                        {exam.wrong_answers ?? 0}
                      </td>

                      <td data-label="Skipped" className={styles.skippedText}>
                        {exam.skipped_answers ?? 0}
                      </td>

                      <td data-label="Score">{exam.score ?? 0}</td>

                      <td data-label="Percentage">{exam.percentage ?? 0}%</td>

                      <td data-label="Details">
                        <button
                          type="button"
                          className={
                            isSelected
                              ? `${styles.detailsButton} ${styles.activeDetailsButton}`
                              : styles.detailsButton
                          }
                          onClick={() => setSelectedExam(exam)}
                        >
                          {isSelected ? 'Viewing' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedExam && (
        <div
          className={styles.detailsOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Exam details"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedExam(null);
            }
          }}
        >
          <aside className={styles.detailsDrawer}>
            <div className={styles.drawerHeader}>
              <div>
                <h3>Exam Details</h3>
                <p>
                  {formatDate(selectedExam.created_at)} ·{' '}
                  {selectedExam.class_level || '-'} · {selectedExam.subject || '-'}
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setSelectedExam(null)}
              >
                ✕ Close
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.summaryGrid}>
                <div className={`${styles.summaryBox} ${styles.correctBox}`}>
                  <span>Correct</span>
                  <strong>{selectedExam.correct_answers ?? 0}</strong>
                </div>

                <div className={`${styles.summaryBox} ${styles.wrongBox}`}>
                  <span>Wrong</span>
                  <strong>{selectedExam.wrong_answers ?? 0}</strong>
                </div>

                <div className={`${styles.summaryBox} ${styles.skippedBox}`}>
                  <span>Skipped</span>
                  <strong>{selectedExam.skipped_answers ?? 0}</strong>
                </div>
              </div>

              <div className={styles.answerList}>
                {selectedExamAnswers.length === 0 && (
                  <div className={styles.statusBox}>
                    No question details found for this exam. Old results may not
                    have saved full question data.
                  </div>
                )}

                {selectedExamAnswers.map((answer, index) => {
                  const options = normalizeOptions(answer.options);
                  const statusClass = getStatusClass(answer.status);
                  const isWrong =
                    String(answer.status || '').toLowerCase() === 'wrong';
                  const explanation = getExplanation(answer);

                  return (
                    <article
                      key={answer.question_id || answer.id || index}
                      className={`${styles.answerCard} ${statusClass}`}
                    >
                      <div className={styles.answerTopRow}>
                        <h4>
                          {index + 1}.{' '}
                          {answer.question || answer.question_text || 'Question'}
                        </h4>

                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          {getStatusLabel(answer.status)}
                        </span>
                      </div>

                      <div className={styles.optionsList}>
                        {options.map((option, optionIndex) => (
                          <div
                            key={`${option.key}-${optionIndex}`}
                            className={`${styles.optionItem} ${getOptionClass(
                              answer,
                              option.key
                            )}`}
                          >
                            <span className={styles.optionKey}>{option.key}</span>
                            <span className={styles.optionText}>{option.text}</span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.answerMeta}>
                        <div
                          className={
                            isWrong
                              ? `${styles.answerInfoBox} ${styles.userWrongAnswer}`
                              : `${styles.answerInfoBox} ${styles.userNormalAnswer}`
                          }
                        >
                          <span>Your Answer</span>
                          <strong>{getUserAnswerDisplay(answer)}</strong>
                        </div>

                        <div
                          className={`${styles.answerInfoBox} ${styles.correctAnswerBox}`}
                        >
                          <span>Correct Answer</span>
                          <strong>{getCorrectAnswerDisplay(answer)}</strong>
                        </div>
                      </div>

                      {explanation && (
                        <div className={styles.explanationBox}>
                          <span>Explanation</span>
                          <p>{explanation}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
