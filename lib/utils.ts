import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function getCountdownParts(targetDate: Date, referenceDate?: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = (referenceDate ?? new Date()).getTime();
  const target = targetDate.getTime();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function getMotivationalQuote(): { text: string; author: string } {
  const quotes = [
    { text: 'Başarı, her gün tekrarlanan küçük çabaların toplamıdır.', author: 'Robert Collier' },
    { text: 'Disciplin, senin istediğin şey ile yapmak zorunda olduğun şey arasındaki köprüdür.', author: 'Jim Rohn' },
    { text: 'Bugün yapacağın fedakarlıklar, yarının zaferlerini belirler.', author: 'Anonim' },
    { text: 'Başarısızlık, başarının habercisidir.', author: 'Napoleon Hill' },
    { text: 'Hayallerin büyüklüğü, çalışmanın derinliği ile ölçülür.', author: 'Anonim' },
    { text: 'Her uzman bir zamanlar başlangıç seviyesindeydi.', author: 'Helen Hayes' },
    { text: 'Kendine inan, çünkü sen bunu başarabilirsin!', author: 'Anonim' },
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export const DAYS = [
  { idx: 1, key: 'monday', short: 'Pzt', label: 'Pazartesi' },
  { idx: 2, key: 'tuesday', short: 'Sal', label: 'Salı' },
  { idx: 3, key: 'wednesday', short: 'Çar', label: 'Çarşamba' },
  { idx: 4, key: 'thursday', short: 'Per', label: 'Perşembe' },
  { idx: 5, key: 'friday', short: 'Cum', label: 'Cuma' },
  { idx: 6, key: 'saturday', short: 'Cmt', label: 'Cumartesi' },
  { idx: 0, key: 'sunday', short: 'Paz', label: 'Pazar' },
] as const;

export type DayKey = (typeof DAYS)[number]['key'];

export function nearestDateForDay(dayIndex: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const today = d.getDay();
  let diff = dayIndex - today;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function dayIndexFromDate(dateStr: string): number {
  try {
    return new Date(dateStr + 'T00:00:00').getDay();
  } catch {
    return -1;
  }
}

export function todayDayKey(): DayKey {
  const d = new Date();
  const idx = d.getDay();
  const f = DAYS.find((x) => x.idx === idx);
  return (f ?? DAYS[0]).key;
}
