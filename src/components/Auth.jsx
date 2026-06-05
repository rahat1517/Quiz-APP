import { useState, useEffect } from 'react';
import styles from './Auth.module.css';
import { signInWithEmail, signUpWithEmail, getSession, resendSignupVerification } from '../services/authService';

export default function Auth({ onAuthSuccess }) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const result = await signUpWithEmail({ email, password });

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
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div>
            <h1>{view === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p>
              {view === 'login'
                ? 'Log in to manage quizzes, save your scores, and continue where you left off.'
                : 'Sign up to save your quiz progress, track results, and access your personal dashboard.'}
            </p>
          </div>
          <button
            type="button"
            className={styles.toggleView}
            onClick={() => {
              setView((current) => (current === 'login' ? 'register' : 'login'));
              setError('');
              setMessage('');
            }}
          >
            {view === 'login' ? 'New here? Sign up' : 'Already have an account? Log in'}
          </button>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <label className={styles.fieldLabel} htmlFor="auth-email">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="rahat123@gmail.com"
          />

          <label className={styles.fieldLabel} htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={view === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="At least 8 characters"
          />

          {view === 'register' && (
            <>
              <label className={styles.fieldLabel} htmlFor="auth-password-confirm">
                Confirm password
              </label>
              <input
                id="auth-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                placeholder="Repeat your password"
              />
            </>
          )}

          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? (view === 'login' ? 'Logging in…' : 'Signing up…') : view === 'login' ? 'Log in' : 'Sign up'}
          </button>

          {message && (
            <div className={`${styles.authFeedback} ${styles.success}`}>
              {message}
              {/* Show a resend option after registration prompt */}
              {message.toLowerCase().includes('check your email') && (
                <div className={styles.resendRow}>
                  <button
                    type="button"
                    className={styles.resendButton}
                    onClick={handleResend}
                    disabled={loading || resendCooldown > 0 || !email}
                  >
                    {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification / send sign-in link'}
                  </button>
                </div>
              )}
            </div>
          )}
          {error && <div className={`${styles.authFeedback} ${styles.error}`}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
