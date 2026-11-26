// Numbers shown in the top bar and on the dashboard, all from the signed-in
// user's own quiz_results rows.

function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive days with at least one quiz, ending today or yesterday. */
export function quizStreak(history = [], now = new Date()) {
  const days = new Set(history.filter((r) => r?.created_at).map((r) => dayKey(r.created_at)));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function quizStats(history = []) {
  const points = history.reduce((sum, r) => sum + (Number(r.correct_answers) || 0), 0);
  const best = history.reduce((max, r) => Math.max(max, Number(r.percentage) || 0), 0);
  const average = history.length
    ? history.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) / history.length
    : 0;
  return {
    attempts: history.length,
    points,
    best: Math.round(best),
    average: Math.round(average),
    streak: quizStreak(history),
  };
}
