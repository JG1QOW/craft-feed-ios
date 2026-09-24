import { interpolate, languageFromLocale, localeFromLanguage } from '..';
import { translations } from '../translations';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('i18n', () => {
  it('has identical keys for en and ja', () => {
    expect(keys(translations.ja).sort()).toEqual(keys(translations.en).sort());
  });

  it('maps server language to locale and back', () => {
    expect(localeFromLanguage('Japanese', 'en')).toBe('ja');
    expect(localeFromLanguage('English', 'ja')).toBe('en');
    expect(localeFromLanguage(null, 'ja')).toBe('ja');
    expect(languageFromLocale('ja')).toBe('Japanese');
    expect(languageFromLocale('en')).toBe('English');
  });

  it('interpolates placeholders', () => {
    expect(interpolate('{count} unread', { count: 3 })).toBe('3 unread');
    expect(interpolate('{missing}', {})).toBe('{missing}');
  });
});
