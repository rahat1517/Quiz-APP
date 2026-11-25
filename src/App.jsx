import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { getQuestions, deleteQuestion, getRandomQuestions } from './services/questionService';
import { normalizeChapter } from './lib/normalizeChapter';
import {
  formatClassLevel,
  normalizeClassLevel,
  isClassInGroup,
} from './lib/normalizeClassLevel';
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
import ConfirmDialog from './components/ConfirmDialog';
import { Button } from './components/ui/Button';
import styles from './App.module.css';
import './index.css';

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('All Chapters');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState('5');
  const [selectedTimeLimit, setSelectedTimeLimit] = useState('5');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  // True once the timer is running and until the attempt is submitted.
  const [quizInProgress, setQuizInProgress] = useState(false);
  // Navigation the user asked for mid-quiz; held until they confirm leaving.
  const [pendingLeave, setPendingLeave] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthCallback, setIsAuthCallback] = useState(
    () => window.location.pathname === '/auth/callback'
  );

  const profileRole = String(profile?.role || '').trim().toLowerCase();
  const isAdmin = profileRole === 'admin';
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')?.[0] || 'Learner';
  const userInitial = String(displayName).trim().charAt(0).toUpperCase() || 'Q';

  const assignedClassLevel =
  profile?.class_level ??
  user?.user_metadata?.class_level ??
  user?.user_metadata?.classLevel;

const assignedClassLabel = assignedClassLevel ? normalizeClassLevel(assignedClassLevel) : null;

// Admin can select any class/exam.
// Normal user can only access assigned class/exam.
const isClassRestricted = !isAdmin && Boolean(assignedClassLabel);
const selectedClass = isClassRestricted ? assignedClassLabel : selectedClassLevel;
  function formatClassLabel(level) {
    return formatClassLevel(level);
  }

  const classLevels = useMemo(() => {
    const unique = new Set(
      questions
        .map((question) => question.class_level)
        .filter(Boolean)
        .map((level) => normalizeClassLevel(level))
    );

    if (unique.has('9') || unique.has('10')) {
      unique.add('9');
      unique.add('10');
    }

    if (unique.has('11') || unique.has('12')) {
      unique.add('11');
      unique.add('12');
    }

    return Array.from(unique).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [questions]);

  useEffect(() => {
    if (!selectedClassLevel && classLevels.length > 0) {
      const updateSelectedClass = window.setTimeout(() => {
        setSelectedClassLevel(classLevels[0]);
      }, 0);

      return () => window.clearTimeout(updateSelectedClass);
    }

    return undefined;
  }, [classLevels, selectedClassLevel]);

  const availableQuestions = useMemo(() => {
    const classToUse = isClassRestricted ? assignedClassLabel : selectedClassLevel;

    if (!classToUse) {
      return isAdmin ? questions : [];
    }

    return questions.filter((question) =>
      isClassInGroup(question.class_level, classToUse)
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
    // Restart the timer so an earlier toast's timeout can't hide a newer one.
    window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }

  function handleQuestionSaved(message = 'Question saved successfully.') {
    setEditingQuestion(null);
    showToast(message, 'success');
    loadQuestions();
  }

  // Run an action that would end the current quiz, asking first if one is underway.
  function confirmQuizExit(action) {
    if (quizInProgress) {
      setPendingLeave(() => action);
      return;
    }

    action();
  }

  function handleSignOut() {
    confirmQuizExit(signOutNow);
  }

  async function signOutNow() {
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
      const classLevelToSave = String(
        result.class_level || (isClassRestricted ? assignedClassLabel : selectedClassLevel) || ''
      ).trim();

      const savedResult = await saveQuizResult({
        classLevel: classLevelToSave,
        subject: selectedSubject === 'All Subjects' ? 'All Subjects' : selectedSubject,
        questionLimit: quizQuestions.length,
        durationMinutes: Number(selectedTimeLimit),
        totalQuestions: result.total,
        correctAnswers: result.correct,
        wrongAnswers: result.wrong,
        skippedAnswers: result.skipped,
        score: result.score,
        percentage: result.percentage,
        answers: result.answers,
      });

      setQuizResult({
        ...savedResult,
        ...result,
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

  function handleTabChange(tab) {
    if (tab === 'add' && !isAdmin) {
      return;
    }

    if (tab !== 'quiz') {
      confirmQuizExit(() => applyTabChange(tab));
      return;
    }

    applyTabChange(tab);
  }

  function applyTabChange(tab) {
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

      const requestedQuestionCount = Number(selectedQuestionCount);

      if (
        !Number.isInteger(requestedQuestionCount) ||
        requestedQuestionCount < 1 ||
        requestedQuestionCount > 100
      ) {
        setQuizError('Enter a whole question count between 1 and 100.');
        setQuizStarted(false);
        return;
      }

      const requestedTimeLimit = Number(selectedTimeLimit);

      if (
        !Number.isInteger(requestedTimeLimit) ||
        requestedTimeLimit < 1 ||
        requestedTimeLimit > 180
      ) {
        setQuizError('Enter a whole time limit between 1 and 180 minutes.');
        setQuizStarted(false);
        return;
      }

      const questions = await getRandomQuestions(
        classLevelToUse,
        subjectFilter,
        chapterFilter,
        requestedQuestionCount
      );

      if (!questions || questions.length === 0) {
        setQuizError(
          'No questions were found for this class, subject, and chapter. Try a different selection.'
        );
        setQuizStarted(false);
        return;
      }

      if (questions.length < requestedQuestionCount) {
        showToast(
          `Only ${questions.length} matching question${questions.length === 1 ? '' : 's'} available. Starting with all of them.`,
          'success'
        );
      }

      setQuizQuestions(questions);
      setQuizStarted(true);
      setActiveTab('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (activeTab !== 'dashboard' && activeTab !== 'results' && activeTab !== 'profile') {
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

  useEffect(() => {
    if (!quizInProgress) {
      return undefined;
    }

    // Warn before a reload or closing the tab discards the attempt.
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quizInProgress]);

  if (authLoading) {
    return (
      <div className={styles.appRoot}>
        <div className={styles.pageShell}>
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (!authLoading && isAuthCallback && !user) {
    return (
      <div className={styles.appRoot}>
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
      <div className={styles.appRoot}>
        <Auth onAuthSuccess={setUser} />
        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div
      data-theme="light"
      className={styles.appRoot}
    >
      <div className={styles.pageShell}>
        <header className={styles.topBar}>
          <Button
            type="button"
            className={styles.brandButton}
            onClick={() => handleTabChange('dashboard')}
            aria-label="Go to dashboard"
          >
            <span className={styles.brandMark}>Q</span>
            <span className={styles.titleBlock}>
              <strong>Quiz World</strong>
              <small>Learn, practice, improve</small>
            </span>
          </Button>

          <div className={styles.controlsRow}>
            {activeTab !== 'quiz' && (
              <div className={styles.filterControl}>
                <label htmlFor="top-subject-filter" className="sr-only">
                  Filter subject
                </label>
                <span className={styles.filterIcon} aria-hidden>⌕</span>
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
              </div>
            )}

            <Button
              type="button"
              className={styles.userCard}
              onClick={() => handleTabChange('profile')}
              aria-label="Open profile"
            >
              <span className={styles.userIcon}>{userInitial}</span>
              <span className={styles.userDetails}>
                <strong>{displayName}</strong>
                <small>
                  {isAdmin ? 'Admin' : formatClassLabel(assignedClassLabel) || 'Student'}
                </small>
              </span>
              <span className={styles.profileArrow} aria-hidden>›</span>
            </Button>

            <div className={styles.actionGroup}>
              <Button
                className={styles.signOutButton}
                type="button"
                onClick={handleSignOut}
                aria-label="Log out"
                title="Log out"
              >
                <span className={styles.signOutIcon} aria-hidden>↪</span>
                <span className={styles.signOutText}>Log out</span>
              </Button>
            </div>
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
              userName={user?.user_metadata?.full_name || user?.email?.split('@')?.[0]}
              classLabel={assignedClassLabel || selectedClassLevel}
              subjects={subjects.filter((subject) => subject !== 'All Subjects').slice(0, 4)}
              history={quizHistory}
              onNavigate={handleTabChange}
              onStartSubject={(subject) => {
                setSelectedSubject(subject);
                setSelectedChapter('All Chapters');
                setQuizStarted(false);
                handleTabChange('quiz');
              }}
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
              classLevels={classLevels}
              selectedClass={selectedClass}
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
            <div className={styles.fieldGroupInline}>
              <div className={styles.field}>
                <label htmlFor="bank-class" className={styles.fieldLabel}>
                  Select class/exam
                </label>
                <select
                  id="bank-class"
                  className={styles.subjectSelect}
                  value={isClassRestricted ? assignedClassLabel : selectedClassLevel}
                  onChange={(event) => {
                    if (isClassRestricted) return;
                    setSelectedClassLevel(event.target.value);
                  }}
                  disabled={isClassRestricted}
                >
                  {classLevels.length === 0 ? (
                    <option value="">No class found</option>
                  ) : (
                    classLevels.map((level) => (
                      <option key={level} value={level}>
                        {formatClassLabel(level)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

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
            {!quizStarted && (
              <div className={styles.quizSelection}>
              <div className={styles.fieldGroupInline}>
                <div className={styles.field}>
                  <label htmlFor="quiz-class" className={styles.fieldLabel}>
                    Class / Exam
                  </label>

                  <select
  id="quiz-class"
  className={styles.subjectSelect}
  value={selectedClass}
  onChange={(event) => {
    if (isClassRestricted) return;

    setSelectedClassLevel(event.target.value);
    setSelectedSubject('All Subjects');
    setSelectedChapter('All Chapters');
    setQuizStarted(false);
  }}
  disabled={isClassRestricted}
>
  {classLevels.length === 0 ? (
    <option value="">
      {isClassRestricted
        ? formatClassLabel(assignedClassLabel) || 'No assigned class'
        : 'No class found'}
    </option>
  ) : (
    Array.from(
      new Set(isClassRestricted && assignedClassLabel
        ? [assignedClassLabel, ...classLevels]
        : classLevels)
    ).map((level) => (
      <option key={level} value={level}>
        {formatClassLabel(level)}
      </option>
    ))
  )}
</select>

                  {isClassRestricted && (
                    <small className={styles.fieldHint}>Set by your account.</small>
                  )}
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
                    Question count
                  </label>

                  <div className={styles.numberControl}>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedQuestionCount((current) =>
                          String(Math.max(1, (Number(current) || 1) - 1))
                        );
                        setQuizStarted(false);
                      }}
                      aria-label="Decrease question count"
                    >
                      −
                    </Button>
                    <input
                      id="quiz-count"
                      className={styles.numberInput}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="100"
                      step="1"
                      value={selectedQuestionCount}
                      onChange={(event) => {
                        setSelectedQuestionCount(event.target.value);
                        setQuizStarted(false);
                      }}
                      onBlur={() => {
                        const value = Number(selectedQuestionCount);
                        setSelectedQuestionCount(
                          String(Number.isInteger(value) && value > 0 ? Math.min(value, 100) : 1)
                        );
                      }}
                      aria-describedby="quiz-count-hint"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedQuestionCount((current) =>
                          String(Math.min(100, (Number(current) || 0) + 1))
                        );
                        setQuizStarted(false);
                      }}
                      aria-label="Increase question count"
                    >
                      +
                    </Button>
                  </div>
                  <small id="quiz-count-hint" className={styles.fieldHint}>
                    Between 1 and 100.
                  </small>
                </div>

                <div className={styles.field}>
                  <label htmlFor="quiz-time" className={styles.fieldLabel}>
                    Time limit
                  </label>

                  <div className={styles.numberControl}>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedTimeLimit((current) =>
                          String(Math.max(1, (Number(current) || 1) - 1))
                        );
                        setQuizStarted(false);
                      }}
                      aria-label="Decrease time limit"
                    >
                      −
                    </Button>
                    <div className={styles.timeInputWrap}>
                      <input
                        id="quiz-time"
                        className={styles.numberInput}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="180"
                        step="1"
                        value={selectedTimeLimit}
                        onChange={(event) => {
                          setSelectedTimeLimit(event.target.value);
                          setQuizStarted(false);
                        }}
                        onBlur={() => {
                          const value = Number(selectedTimeLimit);
                          setSelectedTimeLimit(
                            String(Number.isInteger(value) && value > 0 ? Math.min(value, 180) : 1)
                          );
                        }}
                        aria-describedby="quiz-time-hint"
                      />
                      <span>min</span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedTimeLimit((current) =>
                          String(Math.min(180, (Number(current) || 0) + 1))
                        );
                        setQuizStarted(false);
                      }}
                      aria-label="Increase time limit"
                    >
                      +
                    </Button>
                  </div>
                  <small id="quiz-time-hint" className={styles.fieldHint}>
                    Between 1 and 180 minutes.
                  </small>
                </div>
              </div>

              <Button
                type="button"
                className={`${styles.toggleButton} ${styles.startQuizButton}`}
                disabled={quizLoading}
                onClick={handleStartQuiz}
              >
                {quizLoading ? 'Loading exam…' : 'Start quiz'}
              </Button>

              {quizError && (
                <p className={styles.statusBanner} role="alert">
                  {quizError}
                </p>
              )}
              </div>
            )}

            {quizStarted && quizQuestions.length > 0 && (
              <QuizFullScreen
                key={`quiz-${selectedClass}-${selectedSubject}-${selectedChapter}-${selectedQuestionCount}-${selectedTimeLimit}-${quizQuestions.map((question) => question.id).join('-')}`}
                questions={quizQuestions}
                subject={selectedSubject}
                classLevel={selectedClass}
                questionLimit={quizQuestions.length}
                durationMinutes={selectedTimeLimit}
                storageKey={`quiz-answers-${quizQuestions.map((question) => question.id).join('-')}`}
                onComplete={handleQuizComplete}
                onProgressChange={setQuizInProgress}
                onBackToSetup={() => {
                  setQuizStarted(false);
                  setQuizQuestions([]);
                  setQuizError('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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

        <Footer />
      </div>

      <TabNav
        activeTab={activeTab}
        onChange={handleTabChange}
        variant="left"
        isAdmin={isAdmin}
      />

      <TabNav
        activeTab={activeTab}
        onChange={handleTabChange}
        variant="bottom"
        isAdmin={isAdmin}
      />

      <ConfirmDialog
        open={Boolean(pendingLeave)}
        onOpenChange={(open) => {
          if (!open) setPendingLeave(null);
        }}
        title="Leave this quiz?"
        description="Your timer is still running. If you leave now, this attempt ends and your answers won't be saved."
        confirmLabel="Leave quiz"
        cancelLabel="Keep going"
        tone="danger"
        icon="!"
        onConfirm={() => {
          const action = pendingLeave;
          setPendingLeave(null);
          setQuizInProgress(false);
          action?.();
        }}
      />

      <Toast toast={toast} />
    </div>
  );
}
