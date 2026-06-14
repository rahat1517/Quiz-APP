import { useState, useEffect } from 'react';
import styles from './Auth.module.css';
import { supabase } from '../lib/supabaseClient';
import { normalizeClassLevel } from '../lib/normalizeClassLevel';
import {
  signInWithEmail,
  signUpWithEmail,
  getSession,
  resendSignupVerification,
} from '../services/authService';

const classOptions = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'BCS 44',
  'BCS 45',
  'Other / Custom',
];

export default function Auth({ onAuthSuccess }) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [customClassLevel, setCustomClassLevel] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const COOLDOWN_SECONDS = 60;

  const [resendCooldown, setResendCooldown] = useState(() => {
    try {
      const ts = localStorage.getItem('resend_ts');
      if (!ts) return 0;

      const remaining = Math.ceil((Number(ts) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const t = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          try {
            localStorage.removeItem('resend_ts');
          } catch {
            // ignore localStorage cleanup failures
          }

          clearInterval(t);
          return 0;
        }

        return s - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [resendCooldown]);

  function getFinalClassLevel() {
    if (selectedClassLevel === 'Other / Custom') {
      return customClassLevel.trim();
    }

    return normalizeClassLevel(selectedClassLevel);
  }

  async function saveProfileAfterSignup(user, classLevel) {
    if (!user?.id) return;

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      role: 'user',
      class_level: classLevel,
    });

    if (profileError) {
      console.warn('Profile save failed:', profileError.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (view === 'login') {
        await signInWithEmail({ email, password });

        setMessage('Signed in successfully.');

        const session = await getSession();
        onAuthSuccess?.(session?.user ?? null);
      } else {
        const finalClassLevel = getFinalClassLevel();

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        if (!finalClassLevel) {
          throw new Error('Please select your class or exam category.');
        }

        const result = await signUpWithEmail({
          email,
          password,
          metadata: {
            class_level: finalClassLevel,
            classLevel: finalClassLevel,
          },
        });

        if (result.user) {
          await saveProfileAfterSignup(result.user, finalClassLevel);
        }

        if (result.user && !result.session) {
          setMessage('Registration successful. Please confirm your email before signing in.');
        } else if (result.user && result.session) {
          setMessage('Registration successful. Signed in automatically.');
          onAuthSuccess?.(result.user);
        } else {
          setMessage('Registration successful. Please check your email to verify and then sign in.');
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter an email to send the link to.');
      return;
    }

    if (resendCooldown > 0) {
      setError(`Please wait ${resendCooldown}s before trying again.`);
      return;
    }

    setLoading(true);

    try {
      await resendSignupVerification(email);

      setMessage('A verification email was resent. Check your inbox.');

      const expireAt = Date.now() + COOLDOWN_SECONDS * 1000;

      try {
        localStorage.setItem('resend_ts', String(expireAt));
      } catch {
        // ignore localStorage write failures
      }

      setResendCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message || 'Unable to send verification link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authShell}>
      <div className={styles.backgroundGlowOne} />
      <div className={styles.backgroundGlowTwo} />

      <div className={styles.authCard}>
        <aside className={styles.brandPanel}>
          <div>
            <div className={styles.brand}>
              <span className={styles.brandMark}>Q</span>
              <span>Quiz World</span>
            </div>

            <div className={styles.brandContent}>
              <span className={styles.eyebrow}>Learn. Challenge. Grow.</span>
              <h1>Turn your knowledge into progress.</h1>
              <p>
                Take focused quizzes, track every result, and build confidence
                one answer at a time.
              </p>
            </div>
          </div>

          <div className={styles.benefits}>
            <div><span>01</span><p>Curated quizzes for your class and exams</p></div>
            <div><span>02</span><p>Instant scores with detailed answer review</p></div>
            <div><span>03</span><p>Personal progress that follows you</p></div>
          </div>

          <p className={styles.brandFooter}>A smarter way to practice every day.</p>
        </aside>

        <main className={styles.formPanel}>
          <div className={styles.mobileBrand}>
            <span className={styles.brandMark}>Q</span>
            <span>Quiz World</span>
          </div>

          <div className={styles.viewTabs} aria-label="Authentication options">
            <button
              type="button"
              className={view === 'login' ? styles.activeTab : ''}
              onClick={() => {
                setView('login');
                setError('');
                setMessage('');
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={view === 'register' ? styles.activeTab : ''}
              onClick={() => {
                setView('register');
                setError('');
                setMessage('');
              }}
            >
              Sign up
            </button>
          </div>

          <div className={styles.authHeader}>
            <span className={styles.welcomeIcon}>{view === 'login' ? 'Welcome' : 'Join us'}</span>
            <h2>{view === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>
              {view === 'login'
                ? 'Enter your details to continue your learning journey.'
                : 'Start tracking your quizzes and progress in a few steps.'}
            </p>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="auth-email">
                Email address
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>@</span>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="auth-password">
                Password
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>*</span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {view === 'register' && (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="auth-password-confirm">
                    Confirm password
                  </label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}>*</span>
                    <input
                      id="auth-password-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      placeholder="Repeat your password"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="auth-class-level">
                    Class / Exam category
                  </label>
                  <select
                    id="auth-class-level"
                    className={styles.authSelect}
                    value={selectedClassLevel}
                    onChange={(event) => {
                      setSelectedClassLevel(event.target.value);
                      if (event.target.value !== 'Other / Custom') setCustomClassLevel('');
                    }}
                    required
                  >
                    <option value="">Select class or exam</option>
                    {classOptions.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {selectedClassLevel === 'Other / Custom' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="auth-custom-class">
                      Custom class / exam name
                    </label>
                    <input
                      id="auth-custom-class"
                      type="text"
                      value={customClassLevel}
                      onChange={(event) => setCustomClassLevel(event.target.value)}
                      required
                      placeholder="Example: BCS 46, Admission, HSC 2026"
                    />
                  </div>
                )}
              </>
            )}

            <button type="submit" className={styles.authSubmit} disabled={loading}>
              <span>
                {loading
                  ? view === 'login' ? 'Logging in...' : 'Creating account...'
                  : view === 'login' ? 'Log in to Quiz World' : 'Create my account'}
              </span>
              <span aria-hidden>→</span>
            </button>

            {message && (
              <div className={`${styles.authFeedback} ${styles.success}`}>
                {message}
                {message.toLowerCase().includes('check your email') && (
                  <div className={styles.resendRow}>
                    <button
                      type="button"
                      className={styles.resendButton}
                      onClick={handleResend}
                      disabled={loading || resendCooldown > 0 || !email}
                    >
                      {resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : 'Resend verification email'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className={`${styles.authFeedback} ${styles.error}`}>
                {error}
              </div>
            )}

            <p className={styles.switchPrompt}>
              {view === 'login' ? 'New to Quiz World?' : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setView((current) => (current === 'login' ? 'register' : 'login'));
                  setError('');
                  setMessage('');
                }}
              >
                {view === 'login' ? 'Create an account' : 'Log in instead'}
              </button>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
