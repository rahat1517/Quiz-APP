import { useMemo, useState } from 'react';
import styles from './QuestionBank.module.css';
import { Button } from './ui/Button';
import ConfirmDialog from './ConfirmDialog';

const PAGE_SIZE = 10;
import { getSubjectBadgeStyle } from '../lib/subjectColors';
import { normalizeChapter } from '../lib/normalizeChapter';

export default function QuestionList({
  questions = [],
  subjects = [],
  chapters = [],
  selectedSubject = 'All Subjects',
  selectedChapter = 'All Chapters',
  onSubjectChange,
  onChapterChange,
  onDelete,
  onEdit,
  isAdmin,
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return questions.filter((question) => {
      const questionText = String(question.question_text || '').toLowerCase();
      const questionChapter = normalizeChapter(question.chapter || 'General');

      const matchesSubject =
        selectedSubject === 'All Subjects' || question.subject === selectedSubject;

      const matchesChapter =
        selectedChapter === 'All Chapters' || questionChapter === selectedChapter;

      const matchesSearch = questionText.includes(search.toLowerCase());

      return matchesSubject && matchesChapter && matchesSearch;
    });
  }, [questions, selectedSubject, selectedChapter, search]);

  // Render the bank a page at a time; the count resets whenever the filters change.
  const filterKey = `${selectedSubject}|${selectedChapter}|${search}`;
  const [limit, setLimit] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = limit.key === filterKey ? limit.count : PAGE_SIZE;
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  function handleDelete(id) {
    setPendingDeleteId(id);
  }

  function getOptionClass(question, optionKey) {
    // Only admins see the answer key; students would otherwise get every answer in advance.
    return isAdmin && String(question.correct_answer || '').toUpperCase() === optionKey
      ? `${styles.optionRow} ${styles.correctOption}`
      : styles.optionRow;
  }

  return (
    <section className={styles.bankCard}>
      <div className={styles.titles}>
        <div>
          <h2>Question Bank</h2>
          <p>
            {isAdmin
              ? 'Search, filter, and manage your quizzes with a modern card view.'
              : 'Search and review questions from your assigned class or exam category.'}
          </p>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterField}>
            <label htmlFor="subject-filter" className="sr-only">
              Filter subject
            </label>

            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={(event) => {
                onSubjectChange?.(event.target.value);
              }}
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label htmlFor="chapter-filter" className="sr-only">
              Filter chapter
            </label>

            <select
              id="chapter-filter"
              value={selectedChapter}
              onChange={(event) => {
                onChapterChange?.(event.target.value);
              }}
            >
              {chapters.map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <label className={styles.searchField}>
          <span aria-hidden>🔎</span>
          <span className="sr-only">Search questions</span>
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search questions"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />
        </label>
        <span className={styles.resultCount}>
          {filtered.length} question{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>No questions match this filter.</p>
      ) : (
        <div className={styles.questionList}>
          {visible.map((question, idx) => {
            const number = idx + 1;
            const chapterLabel = normalizeChapter(question.chapter || 'General');

            return (
              <article key={question.id} className={styles.questionItem}>
                <h3>
                  {number}. {question.question_text}
                </h3>

                <div className={styles.metaRow}>
                  <span
                    className={styles.subjectBadge}
                    style={getSubjectBadgeStyle(question.subject)}
                  >
                    {question.subject || 'General'}
                  </span>

                  <span>Class / Exam: {question.class_level || 'N/A'}</span>
                  <span>Chapter: {chapterLabel}</span>
                  {isAdmin && (
                    <span className={styles.correctAnswerBadge}>
                      Correct: {question.correct_answer}
                    </span>
                  )}
                </div>

                <div className={styles.optionList}>
                  <p className={getOptionClass(question, 'A')}>
                    <span className={styles.optionKey}>A</span>
                    <span>{question.option_a}</span>
                  </p>

                  <p className={getOptionClass(question, 'B')}>
                    <span className={styles.optionKey}>B</span>
                    <span>{question.option_b}</span>
                  </p>

                  <p className={getOptionClass(question, 'C')}>
                    <span className={styles.optionKey}>C</span>
                    <span>{question.option_c}</span>
                  </p>

                  <p className={getOptionClass(question, 'D')}>
                    <span className={styles.optionKey}>D</span>
                    <span>{question.option_d}</span>
                  </p>
                </div>

                {isAdmin && question.explanation && (
                  <div className={styles.explanationPreview}>
                    <strong>Explanation:</strong>
                    <p>{question.explanation}</p>
                  </div>
                )}

                {isAdmin && (
                  <div className={styles.actionRow}>
                    <Button
                      type="button"
                      className={`${styles.actionButton} ${styles.edit}`}
                      onClick={() => onEdit && onEdit(question)}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      className={`${styles.actionButton} ${styles.delete}`}
                      onClick={() => handleDelete(question.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {remaining > 0 && (
        <div className={styles.showMoreRow}>
          <span>
            Showing {visible.length} of {filtered.length}
          </span>
          <Button
            type="button"
            className={styles.showMoreButton}
            onClick={() => setLimit({ key: filterKey, count: visibleCount + PAGE_SIZE })}
          >
            Show {Math.min(PAGE_SIZE, remaining)} more
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete this question?"
        description="It will be removed from the bank and from future quizzes. This can't be undone."
        confirmLabel="Delete question"
        tone="danger"
        icon="!"
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          onDelete?.(id);
        }}
      />
    </section>
  );
}
