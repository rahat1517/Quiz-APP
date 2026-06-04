import { useState } from 'react';
import styles from './ProfileSection.module.css';

export default function ProfileSection({ user, profile, history = [], loading, error, onSave }) {
  const displayName = user?.user_metadata?.full_name || '';
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(displayName);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const totalQuizzes = history.length;
  const bestScore = history.reduce((best, item) => Math.max(best, item.score || 0), 0);
  const lastQuiz = history[0];

  return (
    <section className={styles.profileCard}>
      <div className={styles.headerRow}>
        <div>
          <h2>Profile</h2>
          <p className={styles.subtitle}>Your profile details and recent performance are shown here.</p>
        </div>
        {onSave && (
          <div className={styles.profileActions}>
            {editMode ? (
              <>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={async () => {
                    setSaveLoading(true);
                    setSaveError('');
                    setSaveSuccess('');
                    try {
                      await onSave({ full_name: name.trim() });
                      setSaveSuccess('Profile updated successfully.');
                      setEditMode(false);
                    } catch (err) {
                      setSaveError(err.message || 'Unable to save profile.');
                    } finally {
                      setSaveLoading(false);
                    }
                  }}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setEditMode(false);
                    setName(displayName);
                    setSaveError('');
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className={styles.editButton} onClick={() => {
                setName(displayName);
                setEditMode(true);
              }}>
                Edit profile
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.profileInfo}>
          <h3>Account overview</h3>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>
                {editMode ? (
                  <input
                    className={styles.profileInput}
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your display name"
                  />
                ) : (
                  name || user?.email || 'Guest'
                )}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? 'Guest'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile?.role || 'Student'}</dd>
            </div>
            <div>
              <dt>Last active</dt>
              <dd>{lastQuiz ? new Date(lastQuiz.created_at).toLocaleDateString() : 'No quiz yet'}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.performanceBox}>
          <h3>Performance</h3>
          <div className={styles.metricRow}>
            <div>
              <span>Total quizzes</span>
              <strong>{totalQuizzes}</strong>
            </div>
            <div>
              <span>Best score</span>
              <strong>{bestScore}</strong>
            </div>
          </div>
        </div>
      </div>

      {error && <div className={styles.statusBanner}>{error}</div>}
      {saveError && <div className={styles.statusBanner}>{saveError}</div>}
      {saveSuccess && <div className={styles.statusBanner}>{saveSuccess}</div>}
      {loading && <div className={styles.statusBanner}>Loading profile history…</div>}

      {history.length > 0 ? (
        <div className={styles.recentSection}>
          <h3>Recent quiz results</h3>
          <div className={styles.historyList}>
            {history.slice(0, 5).map((item) => (
              <article key={item.id} className={styles.historyItem}>
                <div className={styles.historyHeader}>
                  <strong>{item.subject || 'General'}</strong>
                  <div className={styles.historyMetaRight}>
                    {Number(item.percentage) >= 85 && (
                      <span className={styles.highScoreBadge} title="High scorer">⭐ Top quiz</span>
                    )}
                    <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                  </div>
                </div>
                <div className={styles.historyGrid}>
                  <div>
                    <span>Marks</span>
                    <strong className={styles.scoreBadge}>{item.score} / {item.total_questions ?? item.total}</strong>
                  </div>
                  <div>
                    <span>Correct</span>
                    <strong>{item.correct_answers}</strong>
                  </div>
                  <div>
                    <span>Wrong</span>
                    <strong>{item.wrong_answers}</strong>
                  </div>
                  <div>
                    <span>Skipped</span>
                    <strong>{(item.total_questions ?? item.total) - (item.correct_answers ?? 0) - (item.wrong_answers ?? 0)}</strong>
                  </div>
                  <div>
                    <span>Percentage</span>
                    <strong>{Number(item.percentage)}%</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.empty}>No past results available yet.</p>
      )}
    </section>
  );
}
