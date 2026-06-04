import { useState } from 'react';
import styles from './Auth.module.css';
import { signInWithEmail, signUpWithEmail, getSession, sendMagicLink } from '../services/authService';

export default function Auth({ onAuthSuccess }) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
        await signUpWithEmail({ email, password });
        setMessage('Registration successful. Please check your email to verify and then sign in.');
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
    setLoading(true);
    try {
      await sendMagicLink(email);
      setMessage('A sign-in link was sent to your email. Check your inbox.');
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
            <h1>{view === 'login' ? 'Welcome back' : 'Create an account'}</h1>
            <p>
              {view === 'login'
                ? 'Log in to manage your quizzes, add questions, and track results.'
                : 'Register to securely save your quiz activity and control access.'}
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
            {view === 'login' ? 'Register' : 'Login'}
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
            {loading ? (view === 'login' ? 'Signing in…' : 'Registering…') : view === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {message && (
            <div className={`${styles.authFeedback} ${styles.success}`}>
              {message}
              {/* Show a resend option after registration prompt */}
              {message.toLowerCase().includes('check your email') && (
                <div className={styles.resendRow}>
                  <button type="button" className={styles.resendButton} onClick={handleResend} disabled={loading}>
                    Resend verification / send sign-in link
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
