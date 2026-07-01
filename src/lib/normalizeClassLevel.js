const CLASS_GROUPS = {
  '9': ['9', '10'],
  '10': ['9', '10'],
  '11': ['11', '12'],
  '12': ['11', '12'],
};

export function normalizeClassLevel(value) {
  const label = String(value || '').trim();
  const classMatch = label.match(/^class\s+(\d+)$/i);

  return classMatch ? classMatch[1] : label;
}

export function getClassGroupLevels(value) {
  const normalized = normalizeClassLevel(value);

  return CLASS_GROUPS[normalized] || [normalized];
}

export function isClassInGroup(questionClassLevel, selectedClassLevel) {
  const normalizedQuestion = normalizeClassLevel(questionClassLevel);
  const groupLevels = getClassGroupLevels(selectedClassLevel);

  return groupLevels.includes(normalizedQuestion);
}

export function formatClassLevel(value) {
  const normalized = normalizeClassLevel(value);

  return /^\d+$/.test(normalized) ? `Class ${normalized}` : normalized;
}
