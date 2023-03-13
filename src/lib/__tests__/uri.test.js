import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Cryptos } from '@/lib/constants'
import { parseURIasAIP, generateURI } from '@/lib/uri'

describe('uri', () => {
  describe('parseURIasAIP', () => {
    it('only address', () => {
      expect(parseURIasAIP('adm:U123456')).toEqual({
        address: 'U123456',
        params: {},
        crypto: 'ADM',
        protocol: 'adm'
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
        protocol: 'adm'
      })
    })

    it('with ? symbol but without params', () => {
      expect(parseURIasAIP('adm:U123456?')).toEqual({
        address: 'U123456',
        params: {},
        crypto: 'ADM',
        protocol: 'adm'
      })
    })

    it('address should be case insensitive', () => {
      expect(parseURIasAIP('adm:u123456')).toEqual({
        address: 'u123456',
        params: {},
        crypto: 'ADM',
        protocol: 'adm'
      })
    })

    it('should return address "as is" if is not a valid address', () => {
      expect(parseURIasAIP('not_a_valid_address')).toMatchObject({
        address: 'not_a_valid_address'
      })
    })

    it('should decode URI', () => {
      const encoded = encodeURI('Рик')

      expect(parseURIasAIP(`adm:U123456?label=${encoded}`)).toEqual({
        address: 'U123456',
        params: {
          label: 'Рик'
        },
        crypto: 'ADM',
        protocol: 'adm'
      })
    })

    it('with param which contains a space', () => {
      expect(parseURIasAIP(`adm:U123456?label=Rick Sanchez`)).toEqual({
        address: 'U123456',
        params: {
          label: 'Rick Sanchez'
        },
        crypto: 'ADM',
        protocol: 'adm'
      })
    })
  })

  describe('generateURI', () => {
    const HOSTNAME = 'msg.adamant.im'

    beforeAll(() => {
      delete window.location
      window.location = new URL(`https://${HOSTNAME}`)
    })

    afterAll(() => {
      delete window.location
    })

    it('without contactName', () => {
      expect(generateURI(Cryptos.ADM, 'U123456')).toBe(`https://${HOSTNAME}?address=U123456`)
      expect(generateURI(Cryptos.ADM, 'U123456', '')).toBe(`https://${HOSTNAME}?address=U123456`)
      expect(generateURI(Cryptos.ADM, 'U123456', undefined)).toBe(
        `https://${HOSTNAME}?address=U123456`
      )
    })

    it('with contactName', () => {
      expect(generateURI(Cryptos.ADM, 'U123456', 'Rick')).toBe(
        `https://${HOSTNAME}?address=U123456&label=Rick`
      )
      expect(generateURI(Cryptos.ADM, 'U123456', 'Rick Sanchez')).toBe(
        `https://${HOSTNAME}?address=U123456&label=Rick%20Sanchez`
      )
    })
  })
})
