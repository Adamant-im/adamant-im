import { describe, expect, it } from 'vitest'
import { splitDisplayValueByName } from './splitDisplayValueByName'

describe('splitDisplayValueByName', () => {
  it('splits name + address view and mutes bracket address', () => {
    const result = splitDisplayValueByName('Alice (U123)', 'U123')

    expect(result).toEqual({
      main: 'Alice',
      muted: ' (U123)'
    })
  })

  it('keeps no-name crypto fallback regular', () => {
    const result = splitDisplayValueByName('0xabc (U123)', '0xabc')

    expect(result).toEqual({
      main: '0xabc (U123)',
      muted: ''
    })
  })

  it('treats identical name/address as named view', () => {
    const result = splitDisplayValueByName('U123 (U123)', 'U123')

    expect(result).toEqual({
      main: 'U123',
      muted: ' (U123)'
    })
  })
})
