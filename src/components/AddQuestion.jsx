import { useState } from 'react';
import { addQuestion, updateQuestion } from '../services/questionService';
import styles from './AddQuestion.module.css';

const initialForm = {
  class_level: '6',
  chapter: '',
  subject: '',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
};

const subjectOptions = [
  { label: 'Math', icon: '➗' },
  { label: 'Science', icon: '🧪' },
  { label: 'History', icon: '📜' },
  { label: 'Language', icon: '✍️' },
  { label: 'Technology', icon: '💡' },
];

export default function AddQuestion({ onQuestionAdded, subjects, questionToEdit, onCancel }) {
  const [form, setForm] = useState(() => ({
    class_level: questionToEdit?.class_level ? String(questionToEdit.class_level) : '6',
    chapter: questionToEdit?.chapter || '',
    subject: questionToEdit?.subject || '',
    question_text: questionToEdit?.question_text || '',
    option_a: questionToEdit?.option_a || '',
    option_b: questionToEdit?.option_b || '',
    option_c: questionToEdit?.option_c || '',
    option_d: questionToEdit?.option_d || '',
    correct_answer: questionToEdit?.correct_answer || 'A',
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
      const payload = { ...form };
      if (questionToEdit?.id) {
        await updateQuestion(questionToEdit.id, payload);
        setSuccess('Question updated successfully!');
        onQuestionAdded('Question updated successfully.');
      } else {
        await addQuestion(payload);
        setSuccess('Question added successfully!');
        onQuestionAdded('Question added successfully.');
      }
      setForm(initialForm);
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

  return (
    <section className={styles.card}>
      <div className={styles.headerRow}>
        <div>
          <h2>{questionToEdit ? 'Edit Question' : 'Add Question'}</h2>
          <p>
            {questionToEdit
              ? 'Refine the text, update the options, and choose the correct answer for a better quiz experience.'
              : 'Add a new multiple-choice question with strong subject alignment and a clean preview of your work.'}
          </p>
        </div>
        <span className={styles.statusBadge}>{questionToEdit ? 'Editing mode' : 'New question'}</span>
      </div>

      <div className={styles.innerGrid}>
        <aside className={styles.panel}>
          <div className={styles.panelBlock}>
            <h3>Subject guidance</h3>
            <p>Pick a subject that keeps questions grouped and quizzes relevant. Add a custom subject if a category is missing.</p>
            <div className={styles.subjectChips}>
              {availableSubjects.slice(0, 6).map((option) => (
                <span key={option.label} className={styles.subjectChip}>
                  <span>{option.icon}</span> {option.label}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.panelBlock}>
            <h3>Live preview</h3>
            <div className={styles.previewCard}>
              <strong>{form.subject || 'General'}</strong>
              <p className={styles.previewQuestion}>{form.question_text || 'Enter a question to preview the card.'}</p>
              <ol>
                <li className={form.correct_answer === 'A' ? styles.previewCorrect : ''}>{form.option_a || 'Option A'}</li>
                <li className={form.correct_answer === 'B' ? styles.previewCorrect : ''}>{form.option_b || 'Option B'}</li>
                <li className={form.correct_answer === 'C' ? styles.previewCorrect : ''}>{form.option_c || 'Option C'}</li>
                <li className={form.correct_answer === 'D' ? styles.previewCorrect : ''}>{form.option_d || 'Option D'}</li>
              </ol>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <div className={styles.subjectHub}>
              <div className={styles.subjectCaption}>
                <span className={styles.fieldLabel}>Class level</span>
                <small>Select the student grade for this question.</small>
              </div>
              <div className={styles.field}>
                <select
                  name="class_level"
                  value={form.class_level}
                  onChange={handleChange}
                  required
                >
                  {['6','7','8','9','10','11','12'].map((level) => (
                    <option key={level} value={level}>
                      Class {level}
                    </option>
                  ))}
                </select>
                <label>Class level</label>
              </div>

              <div className={styles.subjectCaption}>
                <span className={styles.fieldLabel}>Subject</span>
                <small>Tap a subject pill or type a custom category.</small>
              </div>

              <div className={styles.subjectCardGrid}>
                {availableSubjects.map((option) => (
                  <button
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
                  </button>
                ))}
              </div>

              <div className={styles.field}>
                <input
                  name="subject"
                  placeholder="Type a custom subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                />
                <label>Custom subject</label>
              </div>

              <div className={styles.field}>
                <input
                  name="chapter"
                  placeholder="Chapter or topic (e.g., Chapter 1)"
                  value={form.chapter}
                  onChange={handleChange}
                />
                <label>Chapter / Topic</label>
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
              <div key={key} className={styles.optionBox}>
                <span className={styles.optionBadge}>{key.toUpperCase()}</span>
                <input
                  name={`option_${key}`}
                  placeholder={`Option ${key.toUpperCase()}`}
                  value={form[`option_${key}`]}
                  onChange={handleChange}
                  required
                />
              </div>
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
              <p>Choose the most accurate correct answer and keep wrong options plausible.</p>
            </div>
          </div>

          <div className={styles.submitRow}>
            {questionToEdit && (
              <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={loading}>
                Cancel edit
              </button>
            )}
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? (questionToEdit ? 'Saving question…' : 'Adding question…') : questionToEdit ? 'Save question' : 'Add question'}
            </button>
          </div>

          {success && <div className={`${styles.statusMessage} ${styles.success}`}>{success}</div>}
          {error && <div className={`${styles.statusMessage} ${styles.error}`}>{error}</div>}
        </form>
      </div>
    </section>
  );
}
