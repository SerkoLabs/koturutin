/**
 * Tiny, dependency-light i18n resolver over the intent-keyed catalogs (spine §11). Detects the
 * device locale via expo-localization, defaults to Turkish (the launch-primary language), and lets
 * the user override it. No third-party i18n dependency is needed for the MVP surface.
 */
import { getLocales } from 'expo-localization';
import type { Language } from '@/domain/types';
import { catalogs, type MessageKey } from './messages';

export type { MessageKey } from './messages';

export function detectLanguage(): Language {
  try {
    const locales = getLocales();
    const code = locales[0]?.languageCode?.toLowerCase();
    return code === 'en' ? 'en' : 'tr'; // default Turkish
  } catch {
    return 'tr';
  }
}

export function translate(language: Language, key: MessageKey): string {
  return catalogs[language][key] ?? catalogs.tr[key] ?? key;
}

/** translate + {placeholder} interpolation, e.g. format(lang, 'week.chose', { n: 3, m: 5 }). */
export function format(language: Language, key: MessageKey, params: Record<string, string | number>): string {
  let s = translate(language, key);
  for (const [k, v] of Object.entries(params)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export type TFunction = (key: MessageKey) => string;

export function makeT(language: Language): TFunction {
  return (key: MessageKey) => translate(language, key);
}
