import { useMemo, useState } from 'react';
import styles from './QuestionBank.module.css';
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
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;

  function handleDelete(id) {
    if (window.confirm('Delete this question permanently?')) {
      if (onDelete) onDelete(id);
    }
  }

  function updatePage(direction) {
    setPage((current) => Math.min(totalPages, Math.max(1, current + direction)));
  }

  return (
    <section className={styles.bankCard}>
      <div className={styles.titles}>
        <div>
          <h2>Question Bank</h2>
          <p>
            {isAdmin
              ? 'Search, filter, and manage your quizzes with a modern card view.'
              : 'Search and review the question bank in read-only mode.'}
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
                setPage(1);
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
                setPage(1);
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
        <div className={styles.searchField}>
          <span>🔎</span>
          <input
            type="text"
            placeholder="Search questions"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {pageData.length === 0 ? (
        <p className={styles.emptyState}>No questions match this filter.</p>
      ) : (
        <div className={styles.questionList}>
          {pageData.map((question, idx) => {
            const number = startIndex + idx + 1;
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

                  <span>Chapter: {chapterLabel}</span>
                  <span>Class: {question.class_level || 'N/A'}</span>
                  <span>Correct: {question.correct_answer}</span>
                </div>

                <div className={styles.optionList}>
                  <p>A. {question.option_a}</p>
                  <p>B. {question.option_b}</p>
                  <p>C. {question.option_c}</p>
                  <p>D. {question.option_d}</p>
                </div>

                {isAdmin && (
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.edit}`}
                      onClick={() => onEdit && onEdit(question)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.delete}`}
                      onClick={() => handleDelete(question.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className={styles.pagination}>
        <button
          type="button"
          className={styles.pagerButton}
          onClick={() => updatePage(-1)}
          disabled={page === 1}
        >
          Previous
        </button>

        <span>
          {page} / {totalPages}
        </span>

        <button
          type="button"
          className={styles.pagerButton}
          onClick={() => updatePage(1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
}