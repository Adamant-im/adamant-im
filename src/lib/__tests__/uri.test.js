import { parseURI } from '@/lib/uri'

describe('uri', () => {
  describe('parseURI', () => {
    it('only address', () => {
      expect(parseURI('adm:U123456')).toEqual({
        address: 'U123456',
        params: {}
      })
    })

    it('address with params', () => {
      expect(parseURI('adm:U123456?firstName=Rick&lastName=Sanchez')).toEqual({
        address: 'U123456',
        params: {
          firstName: 'Rick',
          lastName: 'Sanchez'
        }
      })
    })

    it('with ? symbol but without params', () => {
      expect(parseURI('adm:U123456?')).toEqual({
        address: 'U123456',
        params: {}
      })
    })

    it('address should be case insensitive', () => {
      expect(parseURI('adm:u123456')).toEqual({
        address: 'u123456',
        params: {}
      })
    })

    it('should return undefined if is invalid adamant address', () => {
      expect(parseURI('adm:U123')).toBe(undefined)
    })

    it('should decode URI', () => {
      const encoded = encodeURI('Рик')

      expect(parseURI(`adm:U123456?label=${encoded}`)).toEqual({
        address: 'U123456',
        params: {
          label: 'Рик'
        }
      })
    })
  })
})
