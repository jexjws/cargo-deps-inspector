import en from './en'
import zhCN from './zh-CN'

export const localeOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
] as const

export type SupportedLocale = typeof localeOptions[number]['value']
export const supportedLocales: readonly SupportedLocale[] = localeOptions.map(option => option.value)

export const messages = {
  en,
  'zh-CN': zhCN,
} as const

export const DEFAULT_LOCALE: SupportedLocale = 'en'
export const LOCALE_STORAGE_KEY = 'cargo-deps-inspector-locale'
export const LOCALE_PREFERENCE_STORAGE_KEY = 'cargo-deps-inspector-locale-explicit'

const traditionalChineseSubtags = new Set(['hant', 'hk', 'mo', 'tw'])

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && supportedLocales.includes(value as SupportedLocale)
}

export function resolvePreferredLocale(preferredLocales: readonly string[]): SupportedLocale {
  for (const preferredLocale of preferredLocales) {
    const normalized = preferredLocale.trim().replaceAll('_', '-').toLowerCase()
    if (!normalized)
      continue

    const exactMatch = supportedLocales.find(locale => locale.toLowerCase() === normalized)
    if (exactMatch)
      return exactMatch

    const [language, ...subtags] = normalized.split('-')

    // Only map Simplified or unspecified Chinese to zh-CN. A Traditional
    // Chinese preference can continue to a later browser preference such as en.
    if (language === 'zh') {
      if (subtags.some(subtag => traditionalChineseSubtags.has(subtag)))
        continue
      return 'zh-CN'
    }

    const languageMatch = supportedLocales.find(locale => locale.split('-')[0]?.toLowerCase() === language)
    if (languageMatch)
      return languageMatch
  }

  return DEFAULT_LOCALE
}

export function resolveInitialLocale(
  storedLocale: unknown,
  hasExplicitPreference: boolean,
  preferredLocales: readonly string[],
): SupportedLocale {
  if (hasExplicitPreference && isSupportedLocale(storedLocale))
    return storedLocale

  return resolvePreferredLocale(preferredLocales)
}
