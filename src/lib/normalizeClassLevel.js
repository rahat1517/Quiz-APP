export function normalizeClassLevel(value) {
  const label = String(value || '').trim();
  const classMatch = label.match(/^class\s+(\d+)$/i);

  return classMatch ? classMatch[1] : label;
}

export function formatClassLevel(value) {
  const normalized = normalizeClassLevel(value);

  return /^\d+$/.test(normalized) ? `Class ${normalized}` : normalized;
}
