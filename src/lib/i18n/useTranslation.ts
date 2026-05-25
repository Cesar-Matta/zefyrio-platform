// ═══════════════════════════════════════════════════════════════════
// ZEFYRIO i18n — Translation hook
// Uses Zustand for locale state, supports EN/ES
// ═══════════════════════════════════════════════════════════════════

import { useStore } from '@/store/useStore';
import en, { type TranslationKey } from './locales/en';
import es from './locales/es';

export type Locale = 'en' | 'es';

const locales: Record<Locale, Record<string, string>> = { en, es };

/**
 * Translation hook — returns `t()` function bound to current locale.
 * 
 * Usage:
 * ```tsx
 * const { t, locale, setLocale } = useTranslation();
 * <p>{t('status_go')}</p>
 * ```
 */
export function useTranslation() {
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);

  const t = (key: TranslationKey): string => {
    return locales[locale]?.[key] ?? locales.en[key] ?? key;
  };

  return { t, locale, setLocale };
}

/**
 * Non-hook translation for use outside React components (e.g. in API logic)
 */
export function translate(key: TranslationKey, locale: Locale = 'es'): string {
  return locales[locale]?.[key] ?? locales.en[key] ?? key;
}
