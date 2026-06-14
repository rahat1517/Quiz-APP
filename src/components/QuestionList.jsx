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

  function handleDelete(id) {
    if (window.confirm('Delete this question permanently?')) {
      if (onDelete) onDelete(id);
    }
  }

  function getOptionClass(question, optionKey) {
    return String(question.correct_answer || '').toUpperCase() === optionKey
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
        <div className={styles.searchField}>
          <span>🔎</span>
          <input
            type="text"
            placeholder="Search questions"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
          />
        </div>
        <span className={styles.resultCount}>
          {filtered.length} question{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyState}>No questions match this filter.</p>
      ) : (
        <div className={styles.questionList}>
          {filtered.map((question, idx) => {
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
                  <span className={styles.correctAnswerBadge}>
                    Correct: {question.correct_answer}
                  </span>
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

                {question.explanation && (
                  <div className={styles.explanationPreview}>
                    <strong>Explanation:</strong>
                    <p>{question.explanation}</p>
                  </div>
                )}

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

    </section>
  );
}
