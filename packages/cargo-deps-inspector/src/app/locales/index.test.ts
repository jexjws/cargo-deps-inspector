import { describe, expect, it } from 'vitest'
import {
  isSupportedLocale,
  localeOptions,
  messages,
  resolveInitialLocale,
  resolvePreferredLocale,
  supportedLocales,
} from '.'

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return child && typeof child === 'object'
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path]
  })
}

describe('i18n messages', () => {
  it('provides the same message keys for every supported locale', () => {
    const expected = flattenKeys(messages.en).sort()

    for (const locale of supportedLocales)
      expect(flattenKeys(messages[locale]).sort()).toEqual(expected)
  })

  it('accepts only supported locale identifiers', () => {
    expect(localeOptions.map(option => option.value)).toEqual(supportedLocales)
    expect(isSupportedLocale('en')).toBe(true)
    expect(isSupportedLocale('zh-CN')).toBe(true)
    expect(isSupportedLocale('zh')).toBe(false)
    expect(isSupportedLocale(undefined)).toBe(false)
  })

  it('negotiates supported browser languages in preference order', () => {
    expect(resolvePreferredLocale(['en-GB'])).toBe('en')
    expect(resolvePreferredLocale(['zh-CN'])).toBe('zh-CN')
    expect(resolvePreferredLocale(['zh_Hans_SG'])).toBe('zh-CN')
    expect(resolvePreferredLocale(['ja-JP', 'zh-CN', 'en-US'])).toBe('zh-CN')
    expect(resolvePreferredLocale(['zh-TW', 'en-US'])).toBe('en')
    expect(resolvePreferredLocale(['ja-JP'])).toBe('en')
  })

  it('uses only explicitly selected stored locales', () => {
    expect(resolveInitialLocale('zh-CN', true, ['en-US'])).toBe('zh-CN')
    expect(resolveInitialLocale('zh-CN', false, ['en-US'])).toBe('en')
    expect(resolveInitialLocale('unsupported', true, ['zh-CN'])).toBe('zh-CN')
  })
})
