export function normalizeChapter(input) {
  if (!input) return 'General';
  const s = String(input).trim();

  // If there is a number anywhere, use it: "chapter01", "Chapter1", "ch 1" -> "Chapter 1"
  const numMatch = s.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (!Number.isNaN(n)) return `Chapter ${n}`;
  }

  // Otherwise normalize spacing/punctuation and title-case
  const cleaned = s
    .replace(/[_.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

  if (cleaned.length === 0) return 'General';

  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default normalizeChapter;
