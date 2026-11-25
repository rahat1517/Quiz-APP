import { useState } from 'react';
import { Button } from './ui/Button';
import { addQuestion, updateQuestion } from '../services/questionService';
import styles from './AddQuestion.module.css';

const initialForm = {
  class_level: '',
  chapter: '',
  subject: '',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  explanation: '',
};

const subjectOptions = [
  { label: 'Math', icon: '➗' },
  { label: 'Science', icon: '🧪' },
  { label: 'History', icon: '📜' },
  { label: 'Language', icon: '✍️' },
  { label: 'Technology', icon: '💡' },
];

export default function AddQuestion({
  onQuestionAdded,
  subjects = [],
  classLevels = [],
  selectedClass = '',
  questionToEdit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    class_level: questionToEdit?.class_level
      ? String(questionToEdit.class_level)
      : selectedClass
      ? String(selectedClass)
      : '',
    chapter: questionToEdit?.chapter || '',
    subject: questionToEdit?.subject || '',
    question_text: questionToEdit?.question_text || '',
    option_a: questionToEdit?.option_a || '',
    option_b: questionToEdit?.option_b || '',
    option_c: questionToEdit?.option_c || '',
    option_d: questionToEdit?.option_d || '',
    correct_answer: questionToEdit?.correct_answer || 'A',
    explanation:
      questionToEdit?.explanation ||
      questionToEdit?.answer_explanation ||
      '',
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubject(subject) {
    setForm((prev) => ({
      ...prev,
      subject,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        class_level: String(form.class_level || '').trim(),
        chapter: String(form.chapter || '').trim(),
        subject: String(form.subject || '').trim(),
        question_text: String(form.question_text || '').trim(),
        option_a: String(form.option_a || '').trim(),
        option_b: String(form.option_b || '').trim(),
        option_c: String(form.option_c || '').trim(),
        option_d: String(form.option_d || '').trim(),
        correct_answer: String(form.correct_answer || 'A').trim().toUpperCase(),
        explanation: String(form.explanation || '').trim(),
      };

      if (!payload.class_level) {
        throw new Error('Please enter a class or exam name.');
      }

      if (!payload.subject) {
        throw new Error('Please enter or select a subject.');
      }

      if (!payload.question_text) {
        throw new Error('Please enter the question text.');
      }

      if (
        !payload.option_a ||
        !payload.option_b ||
        !payload.option_c ||
        !payload.option_d
      ) {
        throw new Error('Please fill all four options.');
      }

      if (questionToEdit?.id) {
        await updateQuestion(questionToEdit.id, payload);
        setSuccess('Question updated successfully!');
        onQuestionAdded?.('Question updated successfully.');
      } else {
        await addQuestion(payload);
        setSuccess('Question added successfully!');
        setForm(initialForm);
        onQuestionAdded?.('Question added successfully.');
      }
    } catch (err) {
      setError(err.message || 'Could not save the question.');
    } finally {
      setLoading(false);
    }
  }

  const knownOptionLabels = subjectOptions.map((option) => option.label);

  const availableSubjects = [
    ...subjectOptions,
    ...subjects
      .filter((subject) => subject && !knownOptionLabels.includes(subject))
      .map((label) => ({ label, icon: '📚' })),
  ];

  const availableClassLevels = Array.from(
    new Set([
      ...(classLevels || []),
      form.class_level,
      ...(questionToEdit?.class_level ? [String(questionToEdit.class_level)] : []),
    ].filter(Boolean))
  ).slice(0, 12);

  return (
    <section className={styles.card}>
      <div className={styles.headerRow}>
        <div>
          <h2>{questionToEdit ? 'Edit Question' : 'Add Question'}</h2>
          <p>
            {questionToEdit
              ? 'Refine the text, update the options, explanation, and correct answer.'
              : 'Add a new multiple-choice question with explanation and clean preview.'}
          </p>
        </div>

        <span className={styles.statusBadge}>
          {questionToEdit ? 'Editing mode' : 'New question'}
        </span>
      </div>

      <div className={styles.innerGrid}>
        <aside className={styles.panel}>
          <div className={styles.panelBlock}>
            <h3>Live preview</h3>

            <div className={styles.previewCard}>
              <strong>{form.subject || 'General'}</strong>

              <p className={styles.previewQuestion}>
                {form.question_text || 'Enter a question to preview the card.'}
              </p>

              <ol>
                <li className={form.correct_answer === 'A' ? styles.previewCorrect : ''}>
                  {form.option_a || 'Option A'}
                </li>
                <li className={form.correct_answer === 'B' ? styles.previewCorrect : ''}>
                  {form.option_b || 'Option B'}
                </li>
                <li className={form.correct_answer === 'C' ? styles.previewCorrect : ''}>
                  {form.option_c || 'Option C'}
                </li>
                <li className={form.correct_answer === 'D' ? styles.previewCorrect : ''}>
                  {form.option_d || 'Option D'}
                </li>
              </ol>

              {form.explanation && (
                <div className={styles.previewExplanation}>
                  <span>Explanation</span>
                  <p>{form.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <div className={styles.subjectHub}>
              <div className={styles.field}>
                <label htmlFor="add-class-level" className={styles.fieldLabel}>
                  Class / Exam
                </label>
                <input
                  id="add-class-level"
                  name="class_level"
                  placeholder="Example: Class 9, BCS 44, Admission"
                  value={form.class_level}
                  onChange={handleChange}
                  aria-describedby="add-class-level-hint"
                  required
                />
                <small id="add-class-level-hint" className={styles.fieldHint}>
                  Type a new category or pick an existing one below.
                </small>
              </div>

              {availableClassLevels.length > 0 && (
                <div className={styles.subjectChips}>
                  {availableClassLevels.map((level) => (
                    <Button
                      key={level}
                      type="button"
                      className={
                        form.class_level === level
                          ? `${styles.subjectChoice} ${styles.active}`
                          : styles.subjectChoice
                      }
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          class_level: level,
                        }))
                      }
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              )}

              <span className={styles.fieldLabel} id="add-subject-label">
                Subject
              </span>

              <div
                className={styles.subjectCardGrid}
                role="group"
                aria-labelledby="add-subject-label"
              >
                {availableSubjects.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    className={
                      form.subject === option.label
                        ? `${styles.subjectChoice} ${styles.active}`
                        : styles.subjectChoice
                    }
                    onClick={() => handleSubject(option.label)}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className={styles.field}>
                <label htmlFor="add-subject" className={styles.fieldLabel}>
                  Or type a subject
                </label>
                <input
                  id="add-subject"
                  name="subject"
                  placeholder="Example: Geography"
                  value={form.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="add-chapter" className={styles.fieldLabel}>
                  Chapter / Topic
                </label>
                <input
                  id="add-chapter"
                  name="chapter"
                  placeholder="Example: Chapter 1"
                  value={form.chapter}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="question-text" className={styles.fieldLabel}>
                Question text
              </label>

              <textarea
                id="question-text"
                name="question_text"
                placeholder="Write a crisp, clear multiple-choice question"
                value={form.question_text}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>
          </div>

          <div className={styles.optionsGrid}>
            {['a', 'b', 'c', 'd'].map((key) => (
              <label key={key} className={styles.optionBox}>
                <span className={styles.optionBadge} aria-hidden>
                  {key.toUpperCase()}
                </span>
                <span className="sr-only">Option {key.toUpperCase()}</span>
                <input
                  className={styles.optionInput}
                  name={`option_${key}`}
                  placeholder={`Option ${key.toUpperCase()}`}
                  value={form[`option_${key}`]}
                  onChange={handleChange}
                  required
                />
              </label>
            ))}
          </div>

          <div className={styles.controlBlock}>
            <div>
              <p className={styles.controlLabel}>Correct answer</p>

              <div className={styles.answerGrid}>
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <label key={letter} className={styles.answerOption}>
                    <input
                      type="radio"
                      name="correct_answer"
                      value={letter}
                      checked={form.correct_answer === letter}
                      onChange={handleChange}
                    />
                    <span>{letter}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.metaPanel}>
              <p className={styles.metaLabel}>Tip</p>
              <p>
                Choose the most accurate correct answer and keep wrong options plausible.
              </p>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="explanation" className={styles.fieldLabel}>
              Explanation
            </label>

            <textarea
              id="explanation"
              name="explanation"
              placeholder="Write why this answer is correct. This will show after submit and in past exam details."
              value={form.explanation}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className={styles.submitRow}>
            {questionToEdit && (
              <Button
                type="button"
                className={styles.cancelButton}
                onClick={onCancel}
                disabled={loading}
              >
                Cancel edit
              </Button>
            )}

            <Button type="submit" className={styles.submitButton} disabled={loading}>
              {loading
                ? questionToEdit
                  ? 'Saving question…'
                  : 'Adding question…'
                : questionToEdit
                  ? 'Save question'
                  : 'Add question'}
            </Button>
          </div>

          {success && (
            <div className={`${styles.statusMessage} ${styles.success}`}>
              {success}
            </div>
          )}

          {error && (
            <div className={`${styles.statusMessage} ${styles.error}`}>
              {error}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}