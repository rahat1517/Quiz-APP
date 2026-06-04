import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { getQuestions, deleteQuestion } from './services/questionService';
import { getSession, signOut } from './services/authService';
import { getCurrentProfile } from './services/profileService';
import Auth from './components/Auth';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthCallback, setIsAuthCallback] = useState(() => window.location.pathname === '/auth/callback');

  const isAdmin = profile?.role === 'admin';

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

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      setQuestions([]);
      setSelectedSubject('All Subjects');
      setEditingQuestion(null);
      setQuizResult(null);
      setActiveTab('dashboard');
      showToast('Signed out successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not sign out.', 'error');
    }
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
    if (tab === 'add' && !isAdmin) {
      return;
    }

    if (tab !== 'add') {
      setEditingQuestion(null);
    }
    if (tab !== 'quiz') {
      setQuizStarted(false);
    }
    setActiveTab(tab);
  }

  function handleEditQuestion(question) {
    setEditingQuestion(question);
    setActiveTab('add');
  }

  useEffect(() => {
    async function initializeAuth() {
      try {
        const session = await getSession();
        const userFromSession = session?.user ?? null;
        setUser(userFromSession);

        if (userFromSession && window.location.pathname === '/auth/callback') {
          setActiveTab('dashboard');
          window.history.replaceState({}, '', '/');
          setIsAuthCallback(false);
        }
      } catch (authError) {
        console.warn(authError.message || authError);
      } finally {
        setAuthLoading(false);
      }
    }

    initializeAuth();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refresh = window.setTimeout(() => {
      loadQuestions();
    }, 0);

    return () => window.clearTimeout(refresh);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    async function fetchProfile() {
      try {
        const currentProfile = await getCurrentProfile();
        setProfile(currentProfile);
      } catch (profileError) {
        console.warn(profileError.message || profileError);
        setProfile(null);
      }
    }

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'add') {
      setActiveTab('dashboard');
      setEditingQuestion(null);
    }
  }, [isAdmin, activeTab]);

  if (authLoading) {
    return (
      <div className={`${styles.appRoot} ${styles.dark}`}>
        <div className={styles.pageShell}>
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (!authLoading && isAuthCallback && !user) {
    return (
      <div className={`${styles.appRoot} ${styles.dark}`}>
        <div className={styles.pageShell}>
          <div className={styles.statusBanner}>
            Email verification callback received. Checking your session...
          </div>
          <Auth onAuthSuccess={setUser} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${styles.appRoot} ${styles.dark}`}>
        <Auth onAuthSuccess={setUser} />
      </div>
    );
  }

  return (
    <div className={darkMode ? `${styles.appRoot} ${styles.dark}` : `${styles.appRoot} ${styles.light}`}>
      <div className={styles.pageShell}>
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <h1>Quiz World Dashboard</h1>
            <p>Modern SaaS quiz experience with subjects, score tracking, and polished interactions.</p>
          </div>
          <div className={styles.controlsRow}>
            <div className={styles.userLabel}>
              <span>Signed in as</span>
              <strong>{user?.email}</strong>
              {profile?.role && (
                <small className={styles.userRole}>{profile.role}</small>
              )}
            </div>
            {activeTab !== 'quiz' && (
              <>
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
              </>
            )}
            <button className={styles.toggleButton} type="button" onClick={() => setDarkMode((value) => !value)}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className={styles.signOutButton} type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <TabNav activeTab={activeTab} onChange={handleTabChange} isAdmin={isAdmin} />

        {loading && <SkeletonLoader />}
        {error && <div className={styles.statusBanner}>{error}</div>}

        {!loading && !error && activeTab === 'dashboard' && (
          <section className={styles.sectionGap}>
            <Hero totalQuestions={totalQuestions} totalSubjects={totalSubjects} totalQuizzes={totalQuizzes} />
          </section>
        )}

        {!loading && !error && activeTab === 'add' && isAdmin && (
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

        {!loading && !error && activeTab === 'add' && !isAdmin && (
          <section className={styles.sectionGap}>
            <div className={styles.statusBanner}>Only admin users may add or edit quiz questions.</div>
          </section>
        )}

        {!loading && !error && activeTab === 'bank' && (
          <section className={styles.sectionGap}>
            <QuestionList
              questions={filteredQuestions}
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              onDelete={isAdmin ? handleDeleteQuestion : undefined}
              onEdit={isAdmin ? handleEditQuestion : undefined}
              isAdmin={isAdmin}
            />
          </section>
        )}

        {!loading && !error && activeTab === 'quiz' && (
          <section className={styles.sectionGap}>
            <div className={styles.quizSelection}>
              <label htmlFor="quiz-subject" className={styles.fieldLabel}>
                Choose a subject to start the quiz
              </label>
              <select
                id="quiz-subject"
                className={styles.subjectSelect}
                value={selectedSubject}
                onChange={(event) => {
                  setSelectedSubject(event.target.value);
                  setQuizStarted(false);
                }}
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.toggleButton}
                disabled={selectedSubject === 'All Subjects' || filteredQuestions.length === 0}
                onClick={() => setQuizStarted(true)}
              >
                Start quiz
              </button>
              {selectedSubject === 'All Subjects' && (
                <p className={styles.statusBanner}>Please choose a subject before starting the quiz.</p>
              )}
              {selectedSubject !== 'All Subjects' && filteredQuestions.length === 0 && (
                <p className={styles.statusBanner}>
                  No questions are available for {selectedSubject}. Add questions first.
                </p>
              )}
            </div>
            {quizStarted && filteredQuestions.length > 0 && (
              <Quiz questions={filteredQuestions} onComplete={handleQuizComplete} />
            )}
          </section>
        )}

        {!loading && !error && activeTab === 'results' && (
          <section className={styles.sectionGap}>
            <Result result={quizResult} onRestart={handleRestartQuiz} />
          </section>
        )}

        <Footer />
      </div>
      <TabNav activeTab={activeTab} onChange={handleTabChange} variant="bottom" isAdmin={isAdmin} />
      <Toast toast={toast} />
    </div>
  );
}
