const CLASS_GROUPS = {
  '9': ['9', '10'],
  '10': ['9', '10'],
  '11': ['11', '12'],
  '12': ['11', '12'],
};

export function normalizeClassLevel(value) {
  const label = String(value || '').trim();
  // '49th BCS', 'BCS 49', '49 BCS' সবগুলোকে 'BCS 49' ফরম্যাটে নিয়ে আসবে
  const bcsMatch = label.match(/^(?:BCS[-\s]*(\d+)|(\d+)[-\s]*BCS)/i);
  const classMatch = label.match(/^class\s+(\d+)$/i);

  if (bcsMatch) {
    const bcsNum = bcsMatch[1] || bcsMatch[2];
    return `BCS ${bcsNum}`;
  }

  return classMatch ? classMatch[1] : label;
}

export function getClassGroupLevels(value) {
  const normalized = normalizeClassLevel(value);
  return CLASS_GROUPS[normalized] || [normalized];
}

export function isClassInGroup(questionClassLevel, selectedClassLevel) {
  const normalizedQuestion = normalizeClassLevel(questionClassLevel); // যেমন: 'BCS 49'
  const normalizedSelected = normalizeClassLevel(selectedClassLevel); // যেমন: 'BCS' অথবা 'BCS 49'

  // --- এই অংশটুকুই আসল FIX ---
  // ১. ইউজার যদি ড্রপডাউন বা ফিল্টারে শুধু 'BCS' সিলেক্ট করে (সব BCS প্রশ্ন একসাথে দেখতে)
  if (/^BCS$/i.test(normalizedSelected)) {
    return /^BCS\s*\d+/i.test(normalizedQuestion); // প্রশ্নটি 'BCS 49' বা 'BCS 50' হলেই ট্রু (True) হবে
  }

  // ২. ইউজার যদি নির্দিষ্ট কোনো BCS সিলেক্ট করে (যেমন: 'BCS 49')
  if (/^BCS\s*\d+/i.test(normalizedSelected)) {
    return normalizedQuestion.toLowerCase() === normalizedSelected.toLowerCase();
  }
  // ----------------------------

  // ৩. স্কুল/কলেজের জেনারেল ক্লাসের গ্রুপ ফিল্টারিং (Class 9-10 একসাথে)
  const groupLevels = getClassGroupLevels(selectedClassLevel);
  return groupLevels.includes(normalizedQuestion);
}

export function formatClassLevel(value) {
  const normalized = normalizeClassLevel(value);
  return /^\d+$/.test(normalized) ? `Class ${normalized}` : normalized;
}
