import {
  Atom,
  FlaskConical,
  Sigma,
  Dna,
  Languages,
  BookText,
  Cpu,
  Globe,
  Landmark,
  Calculator,
  Brain,
  ChartPie,
  Sprout,
  BookMarked,
} from 'lucide-react';

// Icon and tile colour for a subject, matched on its name (English or Bangla).
const RULES = [
  [/phys|পদার্থ/i, Atom, 'blue'],
  [/chem|রসায়ন/i, FlaskConical, 'orange'],
  [/higher math|math|গণিত/i, Sigma, 'violet'],
  [/bio|জীব/i, Dna, 'teal'],
  [/english|ইংরেজি/i, Languages, 'rose'],
  [/bangla|bengali|বাংলা/i, BookText, 'rose'],
  [/ict|tech|computer|প্রযুক্তি/i, Cpu, 'blue'],
  [/general knowledge|gk|জ্ঞান/i, Globe, 'teal'],
  [/history|ইতিহাস/i, Landmark, 'orange'],
  [/account|finance|হিসাব/i, Calculator, 'violet'],
  [/mental|psych|মানসিক|মনো/i, Brain, 'violet'],
  [/stat|পরিসংখ্যান/i, ChartPie, 'blue'],
  [/agri|কৃষি/i, Sprout, 'teal'],
];

export function subjectIcon(subject) {
  const name = String(subject || '');
  const match = RULES.find(([pattern]) => pattern.test(name));
  return match ? { Icon: match[1], tint: match[2] } : { Icon: BookMarked, tint: 'blue' };
}
