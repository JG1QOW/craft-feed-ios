import type { Locale } from '../i18n/translations';

export function formatDate(value: string | null | undefined, locale: Locale, never: string): string {
  if (!value) return never;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return never;
  return date.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
