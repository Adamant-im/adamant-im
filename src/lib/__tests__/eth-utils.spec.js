// @vitest-environment node
// Some crypto libs throw errors when using `jsdom` environment

import { describe, it, expect } from 'vitest'
import Web3Eth from 'web3-eth'

import { toEther, toWei, getAccountFromPassphrase, increaseFee } from '@/lib/eth-utils'

describe('eth-utils', () => {
  describe('toEther', () => {
    it('should convert Wei amount to Ether from a number', () => {
      expect(toEther(1)).toBe('0.000000000000000001')
    })

    it('should convert Wei amount to Ether from a numeric string', () => {
      expect(toEther('1')).toBe('0.000000000000000001')
    })
  })

  describe('toWei', () => {
    it('should convert Ether value into Wei from a number', () => {
      expect(toWei(1)).toBe('1000000000000000000')
    })

    it('should convert Ether value into Wei from a numeric string', () => {
      expect(toWei('1')).toBe('1000000000000000000')
    })

    it('should convert Gwei value into Wei', () => {
      expect(toWei(1, 'gwei')).toBe('1000000000')
    })
  })

  describe('getAccountFromPassphrase', () => {
    const passphrase = 'joy mouse injury soft decade bid rough about alarm wreck season sting'
    const api = new Web3Eth('https://clown.adamant.im')

    it('should generate account from passphrase with "web3Account"', () => {
      expect(getAccountFromPassphrase(passphrase, api)).toMatchObject({
        web3Account: {
          address: '0x045d7e948087D9C6D88D58e41587A610400869B6',
          privateKey: '0x344854fa2184c252bdcc09daf8fe7fbcc960aed8f4da68de793f9fbc50b5a686'
        },
        address: '0x045d7e948087D9C6D88D58e41587A610400869B6',
        privateKey: '0x344854fa2184c252bdcc09daf8fe7fbcc960aed8f4da68de793f9fbc50b5a686'
      })
    })

    it('should generate account from passphrase without "web3Account"', () => {
      expect(getAccountFromPassphrase(passphrase)).toEqual({
        privateKey: '0x344854fa2184c252bdcc09daf8fe7fbcc960aed8f4da68de793f9fbc50b5a686'
      })
    })
  })

  describe('increaseFee', () => {
    it('should multiply `gasLimit` as a number', () => {
      expect(increaseFee(21000, 2)).toBe(BigInt(42000))
    })

    it('should multiply `gasLimit` as a bigint', () => {
      expect(increaseFee(BigInt(21000), 2)).toBe(BigInt(42000))
    })

    it('should round the result before converting to bigint', () => {
      expect(increaseFee(BigInt(21001), 1.5)).toBe(BigInt(31502))
    })
  })
})
