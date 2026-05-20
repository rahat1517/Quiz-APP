import { useState } from 'react';
import { addQuestion } from '../services/questionService';

const initialForm = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
};

export default function AddQuestion({ onQuestionAdded }) {
  const [form, setForm] = useState(initialForm);
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

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addQuestion(form);
      setSuccess('Question added successfully!');
      setForm(initialForm);
      onQuestionAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Add Question</h2>

      <form onSubmit={handleSubmit} className="form">
        <input
          name="question_text"
          placeholder="Question"
          value={form.question_text}
          onChange={handleChange}
          required
        />

        <input
          name="option_a"
          placeholder="Option A"
          value={form.option_a}
          onChange={handleChange}
          required
        />

        <input
          name="option_b"
          placeholder="Option B"
          value={form.option_b}
          onChange={handleChange}
          required
        />

        <input
          name="option_c"
          placeholder="Option C"
          value={form.option_c}
          onChange={handleChange}
          required
        />

        <input
          name="option_d"
          placeholder="Option D"
          value={form.option_d}
          onChange={handleChange}
          required
        />

        <select
          name="correct_answer"
          value={form.correct_answer}
          onChange={handleChange}
        >
          <option value="A">Correct Answer: A</option>
          <option value="B">Correct Answer: B</option>
          <option value="C">Correct Answer: C</option>
          <option value="D">Correct Answer: D</option>
        </select>

        <button disabled={loading}>
          {loading ? 'Adding...' : 'Add Question'}
        </button>
      </form>

      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}