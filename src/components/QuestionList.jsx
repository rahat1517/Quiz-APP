export default function QuestionList({ questions }) {
  return (
    <section className="card">
      <h2>All Questions</h2>

      {questions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        <div className="question-list">
          {questions.map((q) => (
            <div key={q.id} className="question-item">
              <h3>{q.question_text}</h3>
              <p>A. {q.option_a}</p>
              <p>B. {q.option_b}</p>
              <p>C. {q.option_c}</p>
              <p>D. {q.option_d}</p>
              <strong>Correct: {q.correct_answer}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}