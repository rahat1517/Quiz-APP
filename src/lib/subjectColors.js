// Subject badges share one style. Green, red and amber are reserved for
// marking answers (correct / wrong / skipped), so subjects don't use them.
const SUBJECT_BADGE = {
  background: 'var(--accent-soft)',
  color: 'var(--accent-strong)',
};

export function getSubjectBadgeStyle() {
  return SUBJECT_BADGE;
}

export default getSubjectBadgeStyle;
