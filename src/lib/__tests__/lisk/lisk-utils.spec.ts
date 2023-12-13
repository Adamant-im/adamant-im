// @vitest-environment node
// Some crypto libs throw errors when using `jsdom` environment

import { LSK_MIN_REQUIRED_FEE } from '@/lib/lisk'
import { convertBeddowsToLSK } from '@liskhq/lisk-transactions'
import { describe, it, expect } from 'vitest'
import { Cryptos } from '@/lib/constants'
import { estimateFee, getAccount } from '@/lib/lisk/lisk-utils'

const passphrase = 'joy mouse injury soft decade bid rough about alarm wreck season sting'

describe('lisk-utils', () => {
  describe('getAccount', () => {
    it('should generate account from passphrase', () => {
      expect(getAccount(Cryptos.LSK, passphrase)).toMatchSnapshot()
    })
  })

  describe('estimateFee', () => {
    const MIN_FEE = convertBeddowsToLSK(LSK_MIN_REQUIRED_FEE.toString())

    it('should return default fee', () => {
      expect(estimateFee()).toBe(MIN_FEE)
    })

    it('should meet minimum required fee', () => {
      expect(
        estimateFee({
          amount: '0.01'
        })
      ).toBe(MIN_FEE)
    })

    it('should calculate fee including `data`', () => {
      const data = 'hello'
      const messageFee = data.length * 1000
      const expectedFee = LSK_MIN_REQUIRED_FEE + messageFee

      expect(estimateFee({ data })).toBe(convertBeddowsToLSK(expectedFee.toString()))
    })
  })
})
