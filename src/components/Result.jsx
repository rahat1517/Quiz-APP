import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, CircleCheck, CircleX, CircleMinus } from 'lucide-react';
import { Button } from './ui/Button';
import { subjectIcon } from '../lib/subjectIcons';
import styles from './Result.module.css';

const ALL = 'All';
const MISTAKES_PAGE = 20;

function shortDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function scoreTone(percentage) {
  if (percentage >= 80) return 'high';
  if (percentage >= 50) return 'mid';
  return 'low';
}

export default function Result({
  result,
  history = [],
  loading = false,
  error = '',
  onRestart,
}) {
  const [selectedExam, setSelectedExam] = useState(null);
  const [tab, setTab] = useState('exams');
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [mistakeLimit, setMistakeLimit] = useState(MISTAKES_PAGE);

  const currentResultId = result?.id;

  const displayedHistory = useMemo(() => {
    if (!currentResultId) {
      return history;
    }

    return history.filter((exam) => exam.id !== currentResultId);
  }, [history, currentResultId]);

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

  // History tabs: subjects present, exams filtered by subject, and every
  // wrongly answered question across all saved quizzes (newest first).
  const historySubjects = Array.from(
    new Set(history.map((exam) => exam.subject).filter((subject) => subject && subject !== 'All Subjects'))
  ).sort();
  const matchesSubject = (exam) => subjectFilter === ALL || exam.subject === subjectFilter;
  const filteredHistory = displayedHistory.filter(matchesSubject);
  const allMistakes = history.flatMap((exam) =>
    getAnswerList(exam)
      .filter((answer) => String(answer.status || '').toLowerCase() === 'wrong')
      .map((answer, index) => ({ key: `${exam.id}-${answer.question_id ?? index}`, exam, answer }))
  );
  const filteredMistakes = allMistakes.filter(({ exam }) => matchesSubject(exam));
  const resultPercentage = Number(latestResult?.percentage) || 0;
  const performance =
    resultPercentage >= 85
      ? { label: 'Excellent work', message: 'You have a strong grasp of this quiz.', tone: styles.excellent }
      : resultPercentage >= 60
        ? { label: 'Good progress', message: 'A little review will make this even stronger.', tone: styles.good }
        : { label: 'Keep practicing', message: 'Review the answers and try again with confidence.', tone: styles.practice };

  return (
    <div className={styles.resultPage}>
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
              <div className={styles.resultActions}>
                <Button
                  type="button"
                  className={styles.reviewButton}
                  onClick={() => setSelectedExam(latestResult)}
                >
                  Review your answers
                </Button>
                {onRestart && (
                  <Button type="button" className={styles.secondaryButton} onClick={onRestart}>
                    Try another quiz
                  </Button>
                )}
              </div>
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

      <section className={styles.historySection} aria-label="Your quizzes">
        <div className={styles.historyTabs} role="tablist" aria-label="History">
          {[
            ['exams', 'Exams', displayedHistory.length],
            ['mistakes', 'Past mistakes', allMistakes.length],
          ].map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? `${styles.historyTab} ${styles.historyTabActive}` : styles.historyTab}
              onClick={() => {
                setTab(id);
                setMistakeLimit(MISTAKES_PAGE);
              }}
            >
              {label}
              <span className={styles.tabCount}>{count}</span>
            </button>
          ))}
        </div>

        {historySubjects.length > 1 && (
          <div className={styles.subjectChips} role="group" aria-label="Filter by subject">
            {[ALL, ...historySubjects].map((subject) => (
              <button
                key={subject}
                type="button"
                aria-pressed={subjectFilter === subject}
                className={subjectFilter === subject ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                onClick={() => {
                  setSubjectFilter(subject);
                  setMistakeLimit(MISTAKES_PAGE);
                }}
              >
                {subject === ALL ? 'All subjects' : subject}
              </button>
            ))}
          </div>
        )}

        {loading && <div className={styles.statusBox}>Loading your quizzes…</div>}

        {error && <div className={styles.errorBox}>{error}</div>}

        {!loading && !error && history.length === 0 && (
          <div className={styles.emptyHistory}>
            <span className={styles.emptyIcon} aria-hidden>
              <ClipboardList size={26} />
            </span>
            <p className={styles.emptyTitle}>No quizzes yet</p>
            <p className={styles.emptyText}>Finished quizzes and the questions you missed show up here.</p>
            {onRestart && (
              <Button type="button" className={styles.reviewButton} onClick={onRestart}>
                Take a quiz
              </Button>
            )}
          </div>
        )}

        {!loading && !error && history.length > 0 && tab === 'exams' && (
          filteredHistory.length === 0 ? (
            <p className={styles.emptyText}>No exams in this subject yet.</p>
          ) : (
            <ul className={styles.examList}>
              {filteredHistory.map((exam) => {
                const { Icon, tint } = subjectIcon(exam.subject);
                const percentage = Math.round(Number(exam.percentage) || 0);
                return (
                  <li key={exam.id}>
                    <button
                      type="button"
                      className={styles.examRow}
                      onClick={() => setSelectedExam(exam)}
                      aria-label={`${exam.subject || 'Mixed'}, ${shortDate(exam.created_at)}, ${percentage}%. Open details`}
                    >
                      <span className={`${styles.examIcon} ${styles[tint]}`} aria-hidden>
                        <Icon size={18} strokeWidth={2.2} />
                      </span>
                      <span className={styles.examMain}>
                        <strong>{exam.subject || 'Mixed'}</strong>
                        <small>{shortDate(exam.created_at)}</small>
                      </span>
                      <span className={styles.examCounts} aria-hidden>
                        <span className={styles.countCorrect}><CircleCheck size={14} /> {exam.correct_answers ?? 0}</span>
                        <span className={styles.countWrong}><CircleX size={14} /> {exam.wrong_answers ?? 0}</span>
                        <span className={styles.countSkipped}><CircleMinus size={14} /> {exam.skipped_answers ?? 0}</span>
                      </span>
                      <span className={`${styles.scorePill} ${styles[scoreTone(percentage)]}`}>{percentage}%</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        )}

        {!loading && !error && history.length > 0 && tab === 'mistakes' && (
          filteredMistakes.length === 0 ? (
            <div className={styles.emptyHistory}>
              <span className={styles.emptyIcon} aria-hidden>
                <CircleCheck size={26} />
              </span>
              <p className={styles.emptyTitle}>No mistakes here</p>
              <p className={styles.emptyText}>Questions you answer wrongly are collected here to review.</p>
            </div>
          ) : (
            <>
              <ul className={styles.mistakeList}>
                {filteredMistakes.slice(0, mistakeLimit).map(({ key, exam, answer }) => (
                  <li key={key} className={styles.mistakeCard}>
                    <div className={styles.mistakeMeta}>
                      <span>{exam.subject || 'Mixed'}</span>
                      <span>{shortDate(exam.created_at)}</span>
                    </div>
                    <p className={styles.mistakeQuestion}>{answer.question || answer.question_text || 'Question'}</p>
                    <div className={styles.mistakeAnswers}>
                      <p className={styles.yourAnswer}>
                        <CircleX size={16} aria-hidden />
                        <span><span className="sr-only">Your answer: </span>{getUserAnswerDisplay(answer)}</span>
                      </p>
                      <p className={styles.rightAnswer}>
                        <CircleCheck size={16} aria-hidden />
                        <span><span className="sr-only">Correct answer: </span>{getCorrectAnswerDisplay(answer)}</span>
                      </p>
                    </div>
                    {getExplanation(answer) && <p className={styles.mistakeExplanation}>{getExplanation(answer)}</p>}
                  </li>
                ))}
              </ul>
              {filteredMistakes.length > mistakeLimit && (
                <Button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setMistakeLimit((n) => n + MISTAKES_PAGE)}
                >
                  Show {Math.min(MISTAKES_PAGE, filteredMistakes.length - mistakeLimit)} more
                </Button>
              )}
            </>
          )
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

              <Button
                type="button"
                className={styles.closeButton}
                onClick={() => setSelectedExam(null)}
              >
                ✕ Close
              </Button>
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
