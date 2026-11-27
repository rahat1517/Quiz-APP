import { useMemo, useState } from 'react';
import styles from './QuestionBank.module.css';
import { Button } from './ui/Button';
import ConfirmDialog from './ConfirmDialog';
import { getSubjectBadgeStyle } from '../lib/subjectColors';
import { normalizeChapter } from '../lib/normalizeChapter';
import { subjectIcon } from '../lib/subjectIcons';
import { Search, ArrowLeft } from 'lucide-react';

const PAGE_SIZE = 10;

const ALL_SUBJECTS = 'All Subjects';
const ALL_CHAPTERS = 'All Chapters';

function Chips({ label, items, selected, allValue, allLabel, onSelect }) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={item === selected ? `${styles.chip} ${styles.chipActive}` : styles.chip}
          aria-pressed={item === selected}
          onClick={() => onSelect(item)}
        >
          {item === allValue ? allLabel : item}
        </button>
      ))}
    </div>
  );
}

export default function QuestionList({
  questions = [],
  subjects = [],
  chapters = [],
  selectedSubject = ALL_SUBJECTS,
  selectedChapter = ALL_CHAPTERS,
  onSubjectChange,
  onChapterChange,
  onDelete,
  onEdit,
  isAdmin,
  classOptions = [],
  selectedClass,
  isClassRestricted,
  onClassChange,
  formatClass = (c) => c,
}) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('subjects');

  // Tile data: question and chapter counts per subject in this class.
  const subjectSummary = useMemo(() => {
    const summary = {};
    questions.forEach((question) => {
      const subject = question.subject || 'General';
      summary[subject] ??= { count: 0, chapters: new Set() };
      summary[subject].count += 1;
      summary[subject].chapters.add(normalizeChapter(question.chapter || 'General'));
    });
    return summary;
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter((question) => {
      const questionText = String(question.question_text || '').toLowerCase();
      const questionChapter = normalizeChapter(question.chapter || 'General');

      const matchesSubject =
        selectedSubject === ALL_SUBJECTS || question.subject === selectedSubject;

      const matchesChapter =
        selectedChapter === ALL_CHAPTERS || questionChapter === selectedChapter;

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

  const showTiles = view === 'subjects' && selectedSubject === ALL_SUBJECTS && !search.trim();
  const subjectNames = subjects.filter((subject) => subject !== ALL_SUBJECTS);

  function switchView(next) {
    setView(next);
    onSubjectChange?.(ALL_SUBJECTS);
  }

  return (
    <section className={styles.bank}>
      <div className={styles.toolbar}>
        <div className={styles.viewSwitch} role="tablist" aria-label="Browse questions">
          {[
            ['subjects', 'By subject'],
            ['all', 'All questions'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={view === id ? `${styles.viewTab} ${styles.viewTabActive}` : styles.viewTab}
              onClick={() => switchView(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          {!isClassRestricted && classOptions.length > 0 && (
            <label className={styles.classPicker}>
              <span className="sr-only">Class or exam</span>
              <select value={selectedClass} onChange={(event) => onClassChange?.(event.target.value)}>
                {classOptions.map((level) => (
                  <option key={level} value={level}>
                    {formatClass(level)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={styles.searchField}>
            <Search size={18} aria-hidden />
            <span className="sr-only">Search questions</span>
            <input
              type="search"
              enterKeyHint="search"
              placeholder="Search questions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </div>

      {showTiles ? (
        subjectNames.length === 0 ? (
          <p className={styles.emptyState}>No questions yet for this class.</p>
        ) : (
          <div className={styles.tileGrid}>
            {subjectNames.map((subject) => {
              const { Icon, tint } = subjectIcon(subject);
              const info = subjectSummary[subject] || { count: 0, chapters: new Set() };
              return (
                <button
                  key={subject}
                  type="button"
                  className={`${styles.tile} ${styles[tint]}`}
                  onClick={() => onSubjectChange?.(subject)}
                >
                  <span className={styles.tileIcon} aria-hidden>
                    <Icon size={26} strokeWidth={2} />
                  </span>
                  <strong>{subject}</strong>
                  <small>
                    {info.count} question{info.count === 1 ? '' : 's'}, {info.chapters.size} chapter
                    {info.chapters.size === 1 ? '' : 's'}
                  </small>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <>
          <div className={styles.listHeader}>
            {selectedSubject !== ALL_SUBJECTS && (
              <button
                type="button"
                className={styles.back}
                onClick={() => onSubjectChange?.(ALL_SUBJECTS)}
              >
                <ArrowLeft size={16} aria-hidden /> All subjects
              </button>
            )}
            <div className={styles.listTitleRow}>
              <h2 className={styles.listTitle}>
                {search.trim()
                  ? `Results for "${search.trim()}"`
                  : selectedSubject === ALL_SUBJECTS
                    ? 'All questions'
                    : selectedSubject}
              </h2>
              <span className={styles.resultCount}>
                {filtered.length} question{filtered.length === 1 ? '' : 's'}
              </span>
            </div>
            {selectedSubject === ALL_SUBJECTS ? (
              <Chips
                label="Filter by subject"
                items={[ALL_SUBJECTS, ...subjectNames]}
                selected={selectedSubject}
                allValue={ALL_SUBJECTS}
                allLabel="All subjects"
                onSelect={(subject) => onSubjectChange?.(subject)}
              />
            ) : (
              <Chips
                label="Filter by chapter"
                items={chapters}
                selected={selectedChapter}
                allValue={ALL_CHAPTERS}
                allLabel="All chapters"
                onSelect={(chapter) => onChapterChange?.(chapter)}
              />
            )}
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

        </>
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
