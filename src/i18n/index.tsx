import React, { createContext, useContext, useMemo } from 'react';
import { getLocales } from 'expo-localization';
import type { Language } from '../api/types';
import { translations, type Locale, type Translations } from './translations';

export function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'ja' ? 'ja' : 'en';
}

export function localeFromLanguage(language: Language | null | undefined, fallback: Locale): Locale {
  if (language === 'Japanese') return 'ja';
  if (language === 'English') return 'en';
  return fallback;
}

export function languageFromLocale(locale: Locale): Language {
  return locale === 'ja' ? 'Japanese' : 'English';
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`,
  );
}

interface I18nState {
  locale: Locale;
  t: Translations;
  format: (template: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nState>(
    () => ({ locale, t: translations[locale], format: interpolate }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
