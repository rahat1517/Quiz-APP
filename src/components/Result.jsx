import { useMemo, useState } from 'react';
import styles from './Result.module.css';

export default function Result({
  result,
  questions = [],
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

  function formatDate(dateValue) {
    if (!dateValue) return '-';

    return new Date(dateValue).toLocaleString('en-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function getStatusClass(status) {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'correct') return styles.correct;
    if (normalizedStatus === 'wrong') return styles.wrong;
    if (normalizedStatus === 'skipped') return styles.skipped;

    return styles.neutral;
  }

  function getStatusLabel(status) {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'correct') return 'Correct';
    if (normalizedStatus === 'wrong') return 'Wrong';
    if (normalizedStatus === 'skipped') return 'Skipped';

    return 'Unknown';
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

  function normalizeOptions(options) {
    if (!options) return [];

    if (Array.isArray(options)) {
      return options.map((option, index) => {
        if (typeof option === 'object' && option !== null) {
          return {
            key: option.key || String.fromCharCode(65 + index),
            text: option.text || '',
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
        key: 'Option',
        text: String(options),
      },
    ];
  }

  function getAnswerDisplay(answer, type) {
    if (type === 'user') {
      if (answer.user_answer_text) {
        return `${answer.user_answer || ''} - ${answer.user_answer_text}`;
      }

      if (answer.selected_answer_text) {
        return `${answer.selected_answer || ''} - ${answer.selected_answer_text}`;
      }

      if (answer.user_answer) {
        return answer.user_answer;
      }

      if (answer.selected_answer) {
        return answer.selected_answer;
      }

      return 'Skipped';
    }

    if (answer.correct_answer_text) {
      return `${answer.correct_answer || ''} - ${answer.correct_answer_text}`;
    }

    if (answer.correctAnswerText) {
      return `${answer.correctAnswer || ''} - ${answer.correctAnswerText}`;
    }

    if (answer.correct_answer) {
      return answer.correct_answer;
    }

    if (answer.correctAnswer) {
      return answer.correctAnswer;
    }

    return '-';
  }

  const selectedExamAnswers = getAnswerList(selectedExam);

  return (
    <div className={styles.resultPage}>
      <div className={styles.headerRow}>
        <div>
          <h2>Quiz Results</h2>
          <p>See your current result and previous exam history.</p>
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
            <p>
              Overall result list. Click details to see all questions, answers,
              right, wrong, and skipped status.
            </p>
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
                {history.map((exam) => (
                  <tr key={exam.id}>
                    <td>{formatDate(exam.created_at)}</td>
                    <td>
                      {exam.class_level ? `Class ${exam.class_level}` : '-'}
                    </td>
                    <td>{exam.subject || '-'}</td>
                    <td>{exam.total_questions ?? 0}</td>
                    <td className={styles.correctText}>
                      {exam.correct_answers ?? 0}
                    </td>
                    <td className={styles.wrongText}>
                      {exam.wrong_answers ?? 0}
                    </td>
                    <td className={styles.skippedText}>
                      {exam.skipped_answers ?? 0}
                    </td>
                    <td>{exam.score ?? 0}</td>
                    <td>{exam.percentage ?? 0}%</td>
                    <td>
                      <button
                        type="button"
                        className={styles.detailsButton}
                        onClick={() => setSelectedExam(exam)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedExam && (
        <section className={styles.detailsPanel}>
          <div className={styles.detailsHeader}>
            <div>
              <h3>Exam Details</h3>
              <p>
                {formatDate(selectedExam.created_at)} · Class{' '}
                {selectedExam.class_level || '-'} ·{' '}
                {selectedExam.subject || '-'}
              </p>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setSelectedExam(null)}
            >
              Close
            </button>
          </div>

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
                No question details found for this exam. Old exam results may
                not have saved full question data.
              </div>
            )}

            {selectedExamAnswers.map((answer, index) => {
              const options = normalizeOptions(answer.options);

              return (
                <div
                  key={answer.question_id || answer.id || index}
                  className={`${styles.answerCard} ${getStatusClass(
                    answer.status
                  )}`}
                >
                  <div className={styles.answerTopRow}>
                    <h4>
                      {index + 1}.{' '}
                      {answer.question || answer.question_text || 'Question'}
                    </h4>

                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        answer.status
                      )}`}
                    >
                      {getStatusLabel(answer.status)}
                    </span>
                  </div>

                  {options.length > 0 && (
                    <div className={styles.optionsList}>
                      {options.map((option, optionIndex) => (
                        <div
                          key={`${option.key}-${optionIndex}`}
                          className={styles.optionItem}
                        >
                          <strong>{option.key}.</strong> {option.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.answerMeta}>
                    <p>
                      <strong>Your Answer:</strong>{' '}
                      {getAnswerDisplay(answer, 'user')}
                    </p>

                    <p>
                      <strong>Correct Answer:</strong>{' '}
                      {getAnswerDisplay(answer, 'correct')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}