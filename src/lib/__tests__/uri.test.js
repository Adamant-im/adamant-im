import { parseURIasAIP, generateURI } from '@/lib/uri'

describe('uri', () => {
  describe('parseURIasAIP', () => {
    it('only address', () => {
      expect(parseURIasAIP('adm:U123456')).toEqual({
        address: 'U123456',
        params: {},
        crypto: 'ADM',
        protocol: "adm"
      })
    })

    it('address with params', () => {
      expect(parseURIasAIP('adm:U123456?firstName=Rick&lastName=Sanchez')).toEqual({
        address: 'U123456',
        params: {
          firstName: 'Rick',
          lastName: 'Sanchez'
        },
        crypto: 'ADM',
        protocol: "adm"
      })
    })

    it('with ? symbol but without params', () => {
      expect(parseURIasAIP('adm:U123456?')).toEqual({
        address: 'U123456',
        params: {},
        crypto: 'ADM',
        protocol: "adm"
      })
    })

    it('address should be case insensitive', () => {
      expect(parseURIasAIP('adm:u123456')).toEqual({
        address: 'u123456',
        params: {},
        crypto: 'ADM',
        protocol: "adm"
      })
    })

    it('should return undefined if is invalid adamant address', () => {
      expect(parseURIasAIP('adm:U123')).toBe(undefined)
    })

    it('should decode URI', () => {
      const encoded = encodeURI('Рик')

      expect(parseURIasAIP(`adm:U123456?label=${encoded}`)).toEqual({
        address: 'U123456',
        params: {
          label: 'Рик'
        },
        crypto: 'ADM',
        protocol: "adm"
      })
    })

    it('with param which contains a space', () => {
      expect(parseURIasAIP(`adm:U123456?label=Rick Sanchez`)).toEqual({
        address: 'U123456',
        params: {
          label: 'Rick Sanchez'
        },
        crypto: 'ADM',
        protocol: "adm"
      })
    })
  })

  describe('generateURI', () => {
    it('without contactName', () => {
      expect(generateURI('U123456')).toBe('adm:U123456')
      expect(generateURI('U123456', '')).toBe('adm:U123456')
      expect(generateURI('U123456', undefined)).toBe('adm:U123456')
    })

    it('with contactName', () => {
      expect(generateURI('U123456', 'Rick')).toBe('adm:U123456?label=Rick')
      expect(generateURI('U123456', 'Rick Sanchez')).toBe('adm:U123456?label=Rick Sanchez')
    })
  })
})
