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

  const latestResult = useMemo(() => {
    if (!result) return null;

    return {
      total_questions: result.total,
      correct_answers: result.correct,
      wrong_answers: result.wrong,
      skipped_answers:
        result.skipped ??
        result.skippedAnswers ??
        Number(result.total || 0) -
          Number(result.correct || 0) -
          Number(result.wrong || 0),
      score: result.score,
      percentage: result.percentage,
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

  return (
    <div className={styles.resultPage}>
      <div className={styles.headerRow}>
        <div>
          <h2>Quiz Results</h2>
          <p>See current result and previous exam history.</p>
        </div>

        {onRestart && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onRestart}
          >
            Restart Quiz
          </button>
        )}
      </div>

      {latestResult && (
        <section className={styles.currentResultCard}>
          <h3>Current Exam Result</h3>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryBox}>
              <span>Total</span>
              <strong>{latestResult.total_questions}</strong>
            </div>

            <div className={`${styles.summaryBox} ${styles.correctBox}`}>
              <span>Correct</span>
              <strong>{latestResult.correct_answers}</strong>
            </div>

            <div className={`${styles.summaryBox} ${styles.wrongBox}`}>
              <span>Wrong</span>
              <strong>{latestResult.wrong_answers}</strong>
            </div>

            <div className={`${styles.summaryBox} ${styles.skippedBox}`}>
              <span>Skipped</span>
              <strong>{latestResult.skipped_answers}</strong>
            </div>

            <div className={styles.summaryBox}>
              <span>Score</span>
              <strong>{latestResult.score}</strong>
            </div>

            <div className={styles.summaryBox}>
              <span>Percentage</span>
              <strong>{latestResult.percentage}%</strong>
            </div>
          </div>
        </section>
      )}

      <section className={styles.historySection}>
        <div className={styles.sectionTitleRow}>
          <div>
            <h3>Past Exams</h3>
            <p>Click Details to open a question-wise review.</p>
          </div>
        </div>

        {loading && (
          <div className={styles.statusBox}>Loading past exams...</div>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        {!loading && !error && history.length === 0 && (
          <div className={styles.statusBox}>No past exam result found.</div>
        )}

        {!loading && !error && history.length > 0 && (
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
                {history.map((exam) => {
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