import { useState } from 'react';

export default function Quiz({ questions }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function handleAnswer(questionId, answer) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  function calculateScore() {
    return questions.reduce((score, question) => {
      return answers[question.id] === question.correct_answer
        ? score + 1
        : score;
    }, 0);
  }

  function resetQuiz() {
    setAnswers({});
    setSubmitted(false);
  }

  if (questions.length === 0) {
    return (
      <section className="card">
        <h2>Start Quiz</h2>
        <p>No questions available.</p>
      </section>
    );
  }

  const score = calculateScore();

  return (
    <section className="card">
      <h2>Start Quiz</h2>

      {questions.map((q, index) => (
        <div key={q.id} className="quiz-question">
          <h3>
            {index + 1}. {q.question_text}
          </h3>

          {['A', 'B', 'C', 'D'].map((optionKey) => {
            const optionText = q[`option_${optionKey.toLowerCase()}`];

            return (
              <label key={optionKey} className="option">
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  value={optionKey}
                  checked={answers[q.id] === optionKey}
                  onChange={() => handleAnswer(q.id, optionKey)}
                  disabled={submitted}
                />
                {optionKey}. {optionText}
              </label>
            );
          })}

          {submitted && (
            <p>
              Correct Answer: <strong>{q.correct_answer}</strong>
            </p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button onClick={() => setSubmitted(true)}>
          Submit Quiz
        </button>
      ) : (
        <div className="result">
          <h3>
            Score: {score} / {questions.length}
          </h3>
          <button onClick={resetQuiz}>Try Again</button>
        </div>
      )}
    </section>
  );
}