import { House, UserRound, CirclePlus, BookOpen, ClipboardList, ChartColumn } from 'lucide-react';

// One list of destinations for the sidebar and the phone tab bar.
// `tint` picks the colour of the small icon tile (see --tint-* in index.css).
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', Icon: House, tint: 'blue' },
  { id: 'bank', label: 'Question Bank', shortLabel: 'Bank', Icon: BookOpen, tint: 'orange' },
  { id: 'quiz', label: 'Quiz', shortLabel: 'Quiz', Icon: ClipboardList, tint: 'rose' },
  { id: 'results', label: 'Results', shortLabel: 'Results', Icon: ChartColumn, tint: 'teal' },
  { id: 'profile', label: 'Profile', shortLabel: 'Profile', Icon: UserRound, tint: 'violet' },
  { id: 'add', label: 'Add Question', shortLabel: 'Add', Icon: CirclePlus, tint: 'blue', adminOnly: true },
];

export function navItemsFor(isAdmin) {
  return NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);
}

export function pageTitle(tabId) {
  return NAV_ITEMS.find((item) => item.id === tabId)?.label ?? 'Dashboard';
}
