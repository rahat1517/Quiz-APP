import { useEffect, useState } from 'react';
import AddQuestion from './components/AddQuestion';
import QuestionList from './components/QuestionList';
import Quiz from './components/Quiz';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import { getQuestions } from './services/questionService';
import './index.css';

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadQuestions() {
    setLoading(true);
    setError('');

    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  return (
    <main className="container">
      <header className="header">
        <h1>Dynamic Quiz App</h1>
        <p>React + Vite + Supabase + Vercel</p>
      </header>

      <nav className="tabs">
        <button onClick={() => setActiveTab('add')}>Add Question</button>
        <button onClick={() => setActiveTab('view')}>View Questions</button>
        <button onClick={() => setActiveTab('quiz')}>Start Quiz</button>
      </nav>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && activeTab === 'add' && (
        <AddQuestion onQuestionAdded={loadQuestions} />
      )}

      {!loading && !error && activeTab === 'view' && (
        <QuestionList questions={questions} />
      )}

      {!loading && !error && activeTab === 'quiz' && (
        <Quiz questions={questions} />
      )}
    </main>
  );
}