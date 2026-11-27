import { useRef, useState } from 'react';
import {
  UserRound,
  KeyRound,
  ChartColumn,
  LogOut,
  Eye,
  EyeOff,
  ChevronRight,
  Flame,
  Star,
  Trophy,
} from 'lucide-react';
import { Button } from './ui/Button';
import { quizStats } from '../lib/quizStats';
import { subjectIcon } from '../lib/subjectIcons';
import styles from './ProfileSection.module.css';

const SECTIONS = [
  { id: 'info', label: 'Personal info', Icon: UserRound, tint: 'blue' },
  { id: 'password', label: 'Change password', Icon: KeyRound, tint: 'orange' },
  { id: 'activity', label: 'My activity', Icon: ChartColumn, tint: 'teal' },
];

const CLASS_LEVELS = ['6', '7', '8', '9', '10', '11', '12'];
const MIN_PASSWORD = 6;

function initials(text) {
  const parts = String(text || '').trim().split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
}

function scoreTone(percent) {
  if (percent >= 80) return styles.high;
  if (percent >= 50) return styles.mid;
  return styles.low;
}

function PersonalInfo({ user, profile, assignedClass, roleLabel, isAdmin, onSave }) {
  const savedName = user?.user_metadata?.full_name || '';
  const [name, setName] = useState(savedName);
  const [classLevel, setClassLevel] = useState(assignedClass || '6');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const nameChanged = name.trim() !== savedName;
  const classChanged = isAdmin && classLevel !== String(assignedClass || '');
  const dirty = nameChanged || classChanged;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setMessage(null);
    const updates = {};
    if (nameChanged) updates.full_name = name.trim();
    if (classChanged) updates.class_level = classLevel;
    try {
      await onSave(updates);
      setMessage({ ok: true, text: 'Saved.' });
    } catch (err) {
      setMessage({ ok: false, text: err.message || 'Unable to save.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Full name</span>
          <input
            className={styles.input}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            maxLength={80}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input className={styles.input} type="email" value={user?.email || ''} readOnly disabled />
          <small className={styles.hint}>Email can't be changed here.</small>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Class</span>
          {isAdmin ? (
            <select className={styles.input} value={classLevel} onChange={(event) => setClassLevel(event.target.value)}>
              {CLASS_LEVELS.map((level) => (
                <option key={level} value={level}>
                  Class {level}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                className={styles.input}
                type="text"
                value={assignedClass ? `Class ${assignedClass}` : 'Not assigned'}
                readOnly
                disabled
              />
              {assignedClass && profile?.role !== 'admin' && (
                <small className={styles.hint}>You only see questions for this class.</small>
              )}
            </>
          )}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Role</span>
          <input className={styles.input} type="text" value={roleLabel} readOnly disabled />
        </label>
      </div>

      <div className={styles.formFooter}>
        {message && (
          <p className={message.ok ? styles.ok : styles.bad} role="status">
            {message.text}
          </p>
        )}
        <Button type="submit" className={styles.primary} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function PasswordInput({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.passwordBox}>
        <input
          id={id}
          className={styles.input}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={MIN_PASSWORD}
          required
        />
        <button
          type="button"
          className={styles.eye}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    </div>
  );
}

function ChangePassword({ onChangePassword }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    if (password.length < MIN_PASSWORD) {
      setMessage({ ok: false, text: `Use at least ${MIN_PASSWORD} characters.` });
      return;
    }
    if (password !== confirm) {
      setMessage({ ok: false, text: "The two passwords don't match." });
      return;
    }
    setSaving(true);
    try {
      await onChangePassword(password);
      setPassword('');
      setConfirm('');
      setMessage({ ok: true, text: 'Password changed.' });
    } catch (err) {
      setMessage({ ok: false, text: err.message || 'Unable to change password.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldStack}>
        <PasswordInput
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordInput
          id="confirm-password"
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <small className={styles.hint}>At least {MIN_PASSWORD} characters.</small>
      </div>
      <div className={styles.formFooter}>
        {message && (
          <p className={message.ok ? styles.ok : styles.bad} role={message.ok ? 'status' : 'alert'}>
            {message.text}
          </p>
        )}
        <Button type="submit" className={styles.primary} disabled={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </form>
  );
}

function Activity({ history, stats, loading, error, onNavigate }) {
  const recent = history.slice(0, 5);
  return (
    <div className={styles.activity}>
      <dl className={styles.statGrid}>
        <div>
          <dt>Quizzes</dt>
          <dd>{stats.attempts}</dd>
        </div>
        <div>
          <dt>Average</dt>
          <dd>{stats.attempts ? `${stats.average}%` : '—'}</dd>
        </div>
        <div>
          <dt>Best</dt>
          <dd>{stats.attempts ? `${stats.best}%` : '—'}</dd>
        </div>
        <div>
          <dt>Points</dt>
          <dd>{stats.points}</dd>
        </div>
      </dl>

      {error && <p className={styles.bad}>{error}</p>}
      {loading && <p className={styles.hint}>Loading your results…</p>}

      <div className={styles.recentHeader}>
        <h3>Recent quizzes</h3>
        {history.length > 0 && onNavigate && (
          <Button type="button" className={styles.link} onClick={() => onNavigate('results')}>
            See all
          </Button>
        )}
      </div>

      {recent.length === 0 ? (
        <p className={styles.empty}>No quizzes yet. Your finished quizzes show up here.</p>
      ) : (
        <ul className={styles.recentList}>
          {recent.map((item) => {
            const percent = Math.round(Number(item.percentage) || 0);
            const { Icon, tint } = subjectIcon(item.subject);
            return (
              <li key={item.id}>
                <span className={`${styles.recentIcon} ${styles[tint]}`} aria-hidden>
                  <Icon size={16} />
                </span>
                <span className={styles.recentText}>
                  <strong>{item.subject || 'Mixed'}</strong>
                  <small>
                    {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    {' · '}
                    {item.correct_answers ?? 0}/{item.total_questions ?? item.total ?? 0} correct
                  </small>
                </span>
                <span className={`${styles.scorePill} ${scoreTone(percent)}`}>{percent}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Profile: identity card and section menu on the left, the chosen section
 * (personal info, password, activity) on the right.
 */
export default function ProfileSection({
  user,
  profile,
  history = [],
  loading,
  error,
  onSave,
  onChangePassword,
  onNavigate,
  onSignOut,
  isAdmin = false,
}) {
  const [section, setSection] = useState('info');
  const panelRef = useRef(null);
  const stats = quizStats(history);
  const name = user?.user_metadata?.full_name || '';
  const assignedClass = profile?.class_level ?? user?.user_metadata?.class_level ?? user?.user_metadata?.classLevel;
  const roleLabel = String(profile?.role || '').toLowerCase() === 'admin' ? 'Admin' : 'Student';
  const current = SECTIONS.find((s) => s.id === section);
  const sections = onChangePassword ? SECTIONS : SECTIONS.filter((s) => s.id !== 'password');

  return (
    <div className={styles.layout}>
      <aside className={styles.side}>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden>
            {initials(name || user?.email)}
          </span>
          <div className={styles.identityText}>
            <h2 className={styles.name}>{name || 'Add your name'}</h2>
            <p className={styles.email}>{user?.email}</p>
            <div className={styles.badges}>
              <span className={styles.badge}>{roleLabel}</span>
              {assignedClass && <span className={styles.badge}>Class {assignedClass}</span>}
            </div>
          </div>
        </div>

        <dl className={styles.miniStats}>
          <div>
            <dt><Trophy size={14} aria-hidden /> Quizzes</dt>
            <dd>{stats.attempts}</dd>
          </div>
          <div>
            <dt><Flame size={14} aria-hidden /> Streak</dt>
            <dd>{stats.streak}</dd>
          </div>
          <div>
            <dt><Star size={14} aria-hidden /> Points</dt>
            <dd>{stats.points}</dd>
          </div>
        </dl>

        <nav className={styles.menu} aria-label="Profile sections">
          {sections.map(({ id, label, Icon, tint }) => (
            <button
              key={id}
              type="button"
              className={section === id ? `${styles.menuItem} ${styles.menuActive}` : styles.menuItem}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => {
                setSection(id);
                // One-column layout: the panel sits under the menu, so bring it into view.
                if (window.matchMedia?.('(max-width: 900px)').matches) {
                  requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }
              }}
            >
              <span className={`${styles.menuIcon} ${styles[tint]}`} aria-hidden>
                <Icon size={16} />
              </span>
              <span className={styles.menuLabel}>{label}</span>
              <ChevronRight size={16} className={styles.menuChevron} aria-hidden />
            </button>
          ))}
          {onSignOut && (
            <button type="button" className={`${styles.menuItem} ${styles.signOut}`} onClick={onSignOut}>
              <span className={`${styles.menuIcon} ${styles.rose}`} aria-hidden>
                <LogOut size={16} />
              </span>
              <span className={styles.menuLabel}>Log out</span>
            </button>
          )}
        </nav>
      </aside>

      <section ref={panelRef} className={styles.panel} aria-labelledby="profile-panel-title">
        <h2 id="profile-panel-title" className={styles.panelTitle}>{current.label}</h2>
        {section === 'info' && (
          <PersonalInfo
            user={user}
            profile={profile}
            assignedClass={assignedClass}
            roleLabel={roleLabel}
            isAdmin={isAdmin}
            onSave={onSave}
          />
        )}
        {section === 'password' && <ChangePassword onChangePassword={onChangePassword} />}
        {section === 'activity' && (
          <Activity history={history} stats={stats} loading={loading} error={error} onNavigate={onNavigate} />
        )}
      </section>
    </div>
  );
}
