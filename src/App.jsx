import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { getQuestions, deleteQuestion, getRandomQuestions } from './services/questionService';
import { getSession, signOut } from './services/authService';
import { getCurrentProfile } from './services/profileService';
import { saveQuizResult, getMyQuizResults, getAllQuizResultsForAdmin } from './services/resultService';
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
  const [selectedClassLevel, setSelectedClassLevel] = useState('6');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(5);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
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

  async function handleQuizComplete(result) {
    setQuizResult(result);
    setActiveTab('results');

    try {
      await saveQuizResult({
        classLevel: selectedClassLevel,
        subject: selectedSubject === 'All Subjects' ? 'All Subjects' : selectedSubject,
        questionLimit: Number(selectedQuestionCount),
        durationMinutes: Number(selectedTimeLimit),
        totalQuestions: result.total,
        correctAnswers: result.correct,
        wrongAnswers: result.wrong,
        score: result.score,
        percentage: result.percentage,
        answers: result.answers,
      });
      showToast('Quiz complete! Your score was saved.', 'success');
      await loadQuizResults();
    } catch (err) {
      showToast(err.message || 'Quiz complete, but could not save the result.', 'error');
    }
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

  async function handleStartQuiz() {
    setQuizError('');
    setQuizLoading(true);
    setQuizQuestions([]);

    try {
      const subjectFilter = selectedSubject === 'All Subjects' ? null : selectedSubject;
      const questions = await getRandomQuestions(Number(selectedClassLevel), subjectFilter, Number(selectedQuestionCount));

      if (!questions || questions.length === 0) {
        setQuizError('No questions were found for this class and subject. Try a different selection.');
        setQuizStarted(false);
        return;
      }

      setQuizQuestions(questions);
      setQuizStarted(true);
      setActiveTab('quiz');
    } catch (err) {
      setQuizError(err.message || 'Unable to load quiz questions.');
      setQuizStarted(false);
    } finally {
      setQuizLoading(false);
    }
  }

  async function loadQuizResults() {
    setResultsLoading(true);
    setResultsError('');

    try {
      const data = isAdmin ? await getAllQuizResultsForAdmin() : await getMyQuizResults();
      setQuizHistory(data || []);
    } catch (err) {
      setResultsError(err.message || 'Failed to load quiz results.');
      setQuizHistory([]);
    } finally {
      setResultsLoading(false);
    }
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
    if (activeTab !== 'results' || !user) {
      return;
    }

    loadQuizResults();
  }, [activeTab, user, isAdmin]);

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
              {profile ? (
                <small className={profile.role === 'admin' ? styles.userRole : styles.userRoleInfo}>
                  {profile.role === 'admin' ? 'Admin user' : profile.role}
                </small>
              ) : (
                <small className={styles.userRoleWarning}>Profile missing</small>
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
        {!loading && !error && !profile && (
          <div className={styles.statusBanner}>
            Your account profile was not found. If you should have admin access, ask the site administrator to add your profile row.
          </div>
        )}

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
              <div className={styles.fieldGroupInline}>
                <div className={styles.field}>
                  <label htmlFor="quiz-class" className={styles.fieldLabel}>
                    Class
                  </label>
                  <select
                    id="quiz-class"
                    className={styles.subjectSelect}
                    value={selectedClassLevel}
                    onChange={(event) => setSelectedClassLevel(event.target.value)}
                  >
                    {['6', '7', '8', '9', '10', '11', '12'].map((level) => (
                      <option key={level} value={level}>
                        Class {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="quiz-subject" className={styles.fieldLabel}>
                    Subject
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
                </div>

                <div className={styles.field}>
                  <label htmlFor="quiz-count" className={styles.fieldLabel}>
                    Questions
                  </label>
                  <select
                    id="quiz-count"
                    className={styles.subjectSelect}
                    value={selectedQuestionCount}
                    onChange={(event) => setSelectedQuestionCount(Number(event.target.value))}
                  >
                    {[5, 10, 20, 30].map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="quiz-time" className={styles.fieldLabel}>
                    Time limit
                  </label>
                  <select
                    id="quiz-time"
                    className={styles.subjectSelect}
                    value={selectedTimeLimit}
                    onChange={(event) => setSelectedTimeLimit(Number(event.target.value))}
                  >
                    {[5, 10, 15, 30].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className={styles.toggleButton}
                disabled={quizLoading}
                onClick={handleStartQuiz}
              >
                {quizLoading ? 'Loading exam…' : 'Start quiz'}
              </button>
              {quizError && <p className={styles.statusBanner}>{quizError}</p>}
              <p className={styles.statusBanner}>Choose class, subject, number of questions, and time limit to start the quiz.</p>
            </div>
            {quizStarted && quizQuestions.length > 0 && (
              <Quiz
                key={`quiz-${selectedClassLevel}-${selectedSubject}-${selectedQuestionCount}-${selectedTimeLimit}-${quizQuestions.length}`}
                questions={quizQuestions}
                subject={selectedSubject}
                classLevel={selectedClassLevel}
                questionLimit={selectedQuestionCount}
                durationMinutes={selectedTimeLimit}
                onComplete={handleQuizComplete}
              />
            )}
          </section>
        )}

        {!loading && !error && activeTab === 'results' && (
          <section className={styles.sectionGap}>
            <Result
              result={quizResult}
              history={quizHistory}
              loading={resultsLoading}
              error={resultsError}
              onRestart={handleRestartQuiz}
            />
          </section>
        )}

        <Footer />
      </div>
      <TabNav activeTab={activeTab} onChange={handleTabChange} variant="bottom" isAdmin={isAdmin} />
      <Toast toast={toast} />
    </div>
  );
}
