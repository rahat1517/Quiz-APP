import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { getQuestions, deleteQuestion, getRandomQuestions } from './services/questionService';
import { normalizeChapter } from './lib/normalizeChapter';
import { getSession, signOut } from './services/authService';
import { getCurrentProfile, updateUserProfile } from './services/profileService';
import { saveQuizResult, getMyQuizResults, getAllQuizResultsForAdmin } from './services/resultService';

import Auth from './components/Auth';
import AddQuestion from './components/AddQuestion';
import QuestionList from './components/QuestionList';
import QuizFullScreen from './components/QuizFullScreen';
import Result from './components/Result';
import ProfileSection from './components/ProfileSection';
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
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('All Chapters');
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
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [footerActive, setFooterActive] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthCallback, setIsAuthCallback] = useState(
    () => window.location.pathname === '/auth/callback'
  );

  const profileRole = String(profile?.role || '').trim().toLowerCase();
  const isAdmin = profileRole === 'admin';

  const assignedClassLevel =
  profile?.class_level ??
  user?.user_metadata?.class_level ??
  user?.user_metadata?.classLevel;

const assignedClassLabel = assignedClassLevel ? String(assignedClassLevel).trim() : null;

// Admin can select any class/exam.
// Normal user can only access assigned class/exam.
const isClassRestricted = !isAdmin && Boolean(assignedClassLabel);
const selectedClass = isClassRestricted ? assignedClassLabel : selectedClassLevel;
  const classLevels = useMemo(() => {
    const unique = Array.from(
      new Set(
        questions
          .map((question) => question.class_level)
          .filter(Boolean)
          .map((level) => String(level))
      )
    );

    return unique.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [questions]);

  useEffect(() => {
    if (!selectedClassLevel && classLevels.length > 0) {
      setSelectedClassLevel(classLevels[0]);
    }
  }, [classLevels, selectedClassLevel]);

 const availableQuestions = useMemo(() => {
  const classToUse = isClassRestricted ? assignedClassLabel : selectedClassLevel;

  if (!classToUse) {
    return isAdmin ? questions : [];
  }

  return questions.filter(
    (question) => String(question.class_level).trim() === String(classToUse).trim()
  );
  }, [questions, selectedClassLevel, isClassRestricted, assignedClassLabel, isAdmin]);

  const subjects = useMemo(() => {
    const unique = Array.from(
      new Set(availableQuestions.map((question) => question.subject || 'General'))
    );

    return ['All Subjects', ...unique];
  }, [availableQuestions]);

  const chapters = useMemo(() => {
    const filtered =
      selectedSubject === 'All Subjects'
        ? availableQuestions
        : availableQuestions.filter((question) => question.subject === selectedSubject);

    const unique = Array.from(
      new Set(filtered.map((question) => normalizeChapter(question.chapter || 'General')))
    );

    return ['All Chapters', ...unique];
  }, [availableQuestions, selectedSubject]);

  const filteredQuestions = useMemo(() => {
    return availableQuestions.filter((question) => {
      const subjectMatched =
        selectedSubject === 'All Subjects' || question.subject === selectedSubject;

      const questionChapter = normalizeChapter(question.chapter || 'General');

      const chapterMatched =
        selectedChapter === 'All Chapters' || questionChapter === selectedChapter;

      return subjectMatched && chapterMatched;
    });
  }, [availableQuestions, selectedSubject, selectedChapter]);

  const totalQuestions = availableQuestions.length;
  const totalSubjects = subjects.length > 1 ? subjects.length - 1 : 0;
  const totalQuizzes = classLevels.length;

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
      setSelectedChapter('All Chapters');
      setSelectedClassLevel('');
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
    setReviewQuestions(quizQuestions);
    setActiveTab('results');

    try {
      const classLevelToSave = String(selectedClassLevel);

      await saveQuizResult({
        classLevel: classLevelToSave,
        subject: selectedSubject === 'All Subjects' ? 'All Subjects' : selectedSubject,
        questionLimit: Number(selectedQuestionCount),
        durationMinutes: Number(selectedTimeLimit),
        totalQuestions: result.total,
        correctAnswers: result.correct,
        wrongAnswers: result.wrong,
        skippedAnswers: result.skipped,
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

  async function handleProfileSave(updates) {
    try {
      const updatedUser = await updateUserProfile(updates);
      setUser(updatedUser);
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to update profile.', 'error');
      throw err;
    }
  }

  function handleRestartQuiz() {
    setQuizResult(null);
    setReviewQuestions([]);
    setActiveTab('quiz');
  }

  function handleThemeToggle() {
    setDarkMode((value) => !value);
    setFooterActive(true);
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
      const chapterFilter = selectedChapter === 'All Chapters' ? null : selectedChapter;
      const classLevelToUse = String( isClassRestricted ? assignedClassLabel : selectedClassLevel ).trim();

      if (!classLevelToUse) {
        setQuizError('Please select a class or exam category.');
        setQuizStarted(false);
        return;
      }

      if (Number(selectedQuestionCount) < 1) {
        setQuizError('Question count must be at least 1.');
        setQuizStarted(false);
        return;
      }

      if (Number(selectedTimeLimit) < 1) {
        setQuizError('Time limit must be at least 1 minute.');
        setQuizStarted(false);
        return;
      }

      const questions = await getRandomQuestions(
        classLevelToUse,
        subjectFilter,
        chapterFilter,
        Number(selectedQuestionCount)
      );

      if (!questions || questions.length === 0) {
        setQuizError(
          'No questions were found for this class, subject, and chapter. Try a different selection.'
        );
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

  const loadQuizResults = useCallback(async () => {
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
  }, [isAdmin]);

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
      return;
    }

    if (activeTab !== 'results' && activeTab !== 'profile') {
      return;
    }

    loadQuizResults();
  }, [activeTab, user, isAdmin, loadQuizResults]);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function fetchProfile() {
      try {
        const currentProfile = await getCurrentProfile();

        if (currentProfile) {
          setProfile(currentProfile);
          return;
        }

        setProfile({
          role: 'user',
          email: user.email,
          class_level:
            user.user_metadata?.class_level ?? user.user_metadata?.classLevel ?? null,
        });
      } catch (profileError) {
        console.warn(profileError.message || profileError);

        setProfile({
          role: 'user',
          email: user.email,
          class_level:
            user.user_metadata?.class_level ?? user.user_metadata?.classLevel ?? null,
        });
      }
    }

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'add') {
      Promise.resolve().then(() => {
        setActiveTab('dashboard');
        setEditingQuestion(null);
      });
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
    <div
      className={
        darkMode
          ? `${styles.appRoot} ${styles.dark}`
          : `${styles.appRoot} ${styles.light}`
      }
    >
      <div className={styles.pageShell}>
        <header className={styles.topBar}>
          <div className={styles.titleBlock}>
            <h1>Quiz World</h1>
            <p>Modern quizzes · Subjects · Scores</p>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.userLabel}>
              <span className={styles.userIcon}>👤</span>
              <strong>{user?.email?.split('@')?.[0] ?? user?.email}</strong>

              {assignedClassLabel && !isAdmin && (
                <small className={styles.userRoleInfo}>{assignedClassLabel}</small>
              )}

              {profile ? (
                <small
                  className={
                    profile.role === 'admin' ? styles.userRole : styles.userRoleInfo
                  }
                >
                  {profile.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                </small>
              ) : (
                <small className={styles.userRoleWarning}>Profile missing</small>
              )}
            </div>

            {activeTab !== 'quiz' && (
              <>
                <label htmlFor="top-subject-filter" className="sr-only">
                  Filter subject
                </label>

                <select
                  id="top-subject-filter"
                  className={styles.subjectSelect}
                  value={selectedSubject}
                  onChange={(event) => {
                    setSelectedSubject(event.target.value);
                    setSelectedChapter('All Chapters');
                  }}
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject === 'All Subjects' ? '📚 All' : `📚 ${subject}`}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button
              className={`${styles.toggleButton} ${
                darkMode ? styles.themeToggleDark : styles.themeToggleLight
              } ${footerActive ? styles.pulseActive : ''}`}
              type="button"
              onClick={handleThemeToggle}
              title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              data-tooltip={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <span className={styles.toggleIcon} aria-hidden>
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>

            <button
              className={styles.signOutButton}
              type="button"
              onClick={handleSignOut}
              aria-label="Log out"
              title="Log out"
            >
              🚪 Log out
            </button>
          </div>
        </header>

        <TabNav activeTab={activeTab} onChange={handleTabChange} isAdmin={isAdmin} />

        {loading && <SkeletonLoader />}

        {error && <div className={styles.statusBanner}>{error}</div>}

        {!loading && !error && !profile && (
          <div className={styles.statusBanner}>
            Your account profile was not found. If you should have admin access,
            ask the site administrator to add your profile row.
          </div>
        )}

        {!loading && !error && activeTab === 'dashboard' && (
          <section className={styles.sectionGap}>
            <Hero
              totalQuestions={totalQuestions}
              totalSubjects={totalSubjects}
              totalQuizzes={totalQuizzes}
            />
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
            <div className={styles.statusBanner}>
              Only admin users may add or edit quiz questions.
            </div>
          </section>
        )}

        {!loading && !error && activeTab === 'bank' && (
          <section className={styles.sectionGap}>
            <QuestionList
              questions={filteredQuestions}
              subjects={subjects}
              chapters={chapters}
              selectedSubject={selectedSubject}
              selectedChapter={selectedChapter}
              onSubjectChange={(subject) => {
                setSelectedSubject(subject);
                setSelectedChapter('All Chapters');
              }}
              onChapterChange={setSelectedChapter}
              onDelete={isAdmin ? handleDeleteQuestion : undefined}
              onEdit={isAdmin ? handleEditQuestion : undefined}
              isAdmin={isAdmin}
            />
          </section>
        )}

        {!loading && !error && activeTab === 'profile' && (
          <section className={styles.sectionGap}>
            <ProfileSection
              user={user}
              profile={profile}
              history={quizHistory}
              loading={resultsLoading}
              error={resultsError}
              onSave={handleProfileSave}
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
                    Class / Exam
                  </label>

                  disabled={isClassRestricted}

                  <small className={styles.fieldHint}>
                    Select the class or exam category.
                  </small>
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
                      setSelectedChapter('All Chapters');
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
                  <label htmlFor="quiz-chapter" className={styles.fieldLabel}>
                    Chapter
                  </label>

                  <select
                    id="quiz-chapter"
                    className={styles.subjectSelect}
                    value={selectedChapter}
                    onChange={(event) => {
                      setSelectedChapter(event.target.value);
                      setQuizStarted(false);
                    }}
                  >
                    {chapters.map((chapter) => (
                      <option key={chapter} value={chapter}>
                        {chapter}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="quiz-count" className={styles.fieldLabel}>
                    Questions
                  </label>

                  <input
                    id="quiz-count"
                    className={styles.subjectSelect}
                    type="number"
                    min="1"
                    max="100"
                    value={selectedQuestionCount}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setSelectedQuestionCount(value > 0 ? value : 1);
                      setQuizStarted(false);
                    }}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="quiz-time" className={styles.fieldLabel}>
                    Time limit/min
                  </label>

                  <input
                    id="quiz-time"
                    className={styles.subjectSelect}
                    type="number"
                    min="1"
                    max="180"
                    value={selectedTimeLimit}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setSelectedTimeLimit(value > 0 ? value : 1);
                      setQuizStarted(false);
                    }}
                  />
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

              <p className={styles.statusBanner}>
                Choose class/exam, subject, chapter, question count, and time limit
                to start the quiz.
              </p>
            </div>

            {quizStarted && quizQuestions.length > 0 && (
              <QuizFullScreen
                key={`quiz-${selectedClassLevel}-${selectedSubject}-${selectedChapter}-${selectedQuestionCount}-${selectedTimeLimit}-${quizQuestions.length}`}
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
              questions={reviewQuestions}
              history={quizHistory}
              loading={resultsLoading}
              error={resultsError}
              onRestart={handleRestartQuiz}
            />
          </section>
        )}

        <Footer honorActive={footerActive} />
      </div>

      <TabNav
        activeTab={activeTab}
        onChange={handleTabChange}
        variant="bottom"
        isAdmin={isAdmin}
      />

      <Toast toast={toast} />
    </div>
  );
}