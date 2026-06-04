import { useEffect, useMemo, useState } from 'react';
import { getQuestions, deleteQuestion } from './services/questionService';
import AddQuestion from './components/AddQuestion';
import QuestionList from './components/QuestionList';
import Quiz from './components/Quiz';
import Result from './components/Result';
import Footer from './components/Footer';
import Toast from './components/Toast';
import SkeletonLoader from './components/SkeletonLoader';
import TabNav from './components/TabNav';
import Hero from './components/Hero';
import styles from './App.module.css';
import './index.css';

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const subjects = useMemo(() => {
    const unique = Array.from(new Set(questions.map((question) => question.subject || 'General')));
    return ['All Subjects', ...unique];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (selectedSubject === 'All Subjects') return questions;
    return questions.filter((question) => question.subject === selectedSubject);
  }, [questions, selectedSubject]);

  const totalQuestions = questions.length;
  const totalSubjects = subjects.length > 1 ? subjects.length - 1 : 0;
  const totalQuizzes = totalSubjects;

  async function loadQuestions() {
    setLoading(true);
    setError('');

    try {
      const data = await getQuestions();
      setQuestions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteQuestion(id) {
    try {
      setLoading(true);
      await deleteQuestion(id);
      await loadQuestions();
      showToast('Question deleted successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to delete question.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function handleQuestionSaved(message = 'Question saved successfully.') {
    setEditingQuestion(null);
    showToast(message, 'success');
    loadQuestions();
  }

  function handleQuizComplete(result) {
    setQuizResult(result);
    setActiveTab('results');
    showToast('Quiz complete! See your results.', 'success');
  }

  function handleRestartQuiz() {
    setQuizResult(null);
    setActiveTab('quiz');
  }

  function handleTabChange(tab) {
    if (tab !== 'add') {
      setEditingQuestion(null);
    }
    setActiveTab(tab);
  }

  function handleEditQuestion(question) {
    setEditingQuestion(question);
    setActiveTab('add');
  }

  useEffect(() => {
    async function fetchData() {
      await loadQuestions();
    }

    fetchData();
  }, []);

  return (
    <div className={darkMode ? `${styles.appRoot} ${styles.dark}` : `${styles.appRoot} ${styles.light}`}>
      <div className={styles.pageShell}>
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <h1>Quiz World Dashboard</h1>
            <p>Modern SaaS quiz experience with subjects, score tracking, and polished interactions.</p>
          </div>
          <div className={styles.controlsRow}>
            <label htmlFor="top-subject-filter" className="sr-only">Filter subject</label>
            <select
              id="top-subject-filter"
              className={styles.subjectSelect}
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <button className={styles.toggleButton} type="button" onClick={() => setDarkMode((value) => !value)}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        <TabNav activeTab={activeTab} onChange={handleTabChange} />

        {loading && <SkeletonLoader />}
        {error && <div className={styles.statusBanner}>{error}</div>}

        {!loading && !error && activeTab === 'dashboard' && (
          <section className={styles.sectionGap}>
            <Hero totalQuestions={totalQuestions} totalSubjects={totalSubjects} totalQuizzes={totalQuizzes} />
          </section>
        )}

        {!loading && !error && activeTab === 'add' && (
          <section className={styles.sectionGap}>
            <AddQuestion
              key={editingQuestion?.id ?? 'new'}
              questionToEdit={editingQuestion}
              onQuestionAdded={handleQuestionSaved}
              onCancel={() => {
                setEditingQuestion(null);
                setActiveTab('bank');
              }}
              subjects={subjects.filter((subject) => subject !== 'All Subjects')}
            />
          </section>
        )}

        {!loading && !error && activeTab === 'bank' && (
          <section className={styles.sectionGap}>
            <QuestionList
              questions={filteredQuestions}
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              onDelete={handleDeleteQuestion}
              onEdit={handleEditQuestion}
            />
          </section>
        )}

        {!loading && !error && activeTab === 'quiz' && (
          <section className={styles.sectionGap}>
            <Quiz questions={filteredQuestions} onComplete={handleQuizComplete} />
          </section>
        )}

        {!loading && !error && activeTab === 'results' && (
          <section className={styles.sectionGap}>
            <Result result={quizResult} onRestart={handleRestartQuiz} />
          </section>
        )}

        <Footer />
      </div>
      <TabNav activeTab={activeTab} onChange={handleTabChange} variant="bottom" />
      <Toast toast={toast} />
    </div>
  );
}
