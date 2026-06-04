export function getSubjectBadgeStyle(subject) {
  const s = String(subject || 'General').toLowerCase();

  if (s.includes('math')) {
    return {
      background: 'linear-gradient(90deg, rgba(59,130,246,0.16), rgba(99,102,241,0.12))',
      color: '#dbeafe',
    };
  }

  if (s.includes('science')) {
    return {
      background: 'linear-gradient(90deg, rgba(16,185,129,0.14), rgba(5,150,105,0.10))',
      color: '#bbf7d0',
    };
  }

  if (s.includes('history')) {
    return {
      background: 'linear-gradient(90deg, rgba(245,158,11,0.14), rgba(234,88,12,0.10))',
      color: '#fde68a',
    };
  }

  if (s.includes('language') || s.includes('lang')) {
    return {
      background: 'linear-gradient(90deg, rgba(168,85,247,0.14), rgba(124,58,237,0.10))',
      color: '#e9d5ff',
    };
  }

  if (s.includes('tech') || s.includes('technology')) {
    return {
      background: 'linear-gradient(90deg, rgba(20,184,166,0.14), rgba(13,148,136,0.10))',
      color: '#bef3e6',
    };
  }

  // default
  return {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    color: '#f8fafc',
  };
}

export default getSubjectBadgeStyle;
