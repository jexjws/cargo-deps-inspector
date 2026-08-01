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

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'
export const LOCALE_STORAGE_KEY = 'cargo-deps-inspector-locale'

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && supportedLocales.includes(value as SupportedLocale)
}
