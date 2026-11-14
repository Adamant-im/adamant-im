import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

vi.mock('@/store', () => ({ default: { state: { options: { useFullDate: false } } } }))

import { DEFAULT_LOCALE, applyLocale } from '@/i18n'
import formatDate from '@/filters/date'
import formatDateBrief from '@/filters/dateBrief'

// Older than the current year, so the month name is always part of the output
const lastYear = new Date(new Date().getFullYear() - 1, 8, 24, 12, 34).getTime()

describe('date filters', () => {
  afterEach(() => {
    applyLocale(DEFAULT_LOCALE)
  })

  it.each([
    ['chat list', formatDateBrief],
    ['message', formatDate]
  ])('re-render %s dates in the new language after a language change', (_, format) => {
    applyLocale('en')
    const formatted = computed(() => format(lastYear))

    expect(formatted.value).toContain('Sep')

    applyLocale('ar')

    expect(formatted.value).toContain('سبتمبر')
    expect(formatted.value).not.toContain('Sep')
  })
})
