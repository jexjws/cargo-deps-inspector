import { describe, expect, it } from 'vitest'
import { isSupportedLocale, localeOptions, messages, supportedLocales } from '.'

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
})
