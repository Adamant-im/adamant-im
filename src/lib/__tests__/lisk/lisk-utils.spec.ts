// @vitest-environment node
// Some crypto libs throw errors when using `jsdom` environment

import { KLY_MIN_FEE_PER_BYTE } from '@/lib/klayr'
import { convertBeddowsTokly } from '@klayr/transactions'
import { describe, it, expect } from 'vitest'
import { Cryptos } from '@/lib/constants'
import { estimateFee, getAccount } from '@/lib/klayr/klayr-utils'

const passphrase = 'joy mouse injury soft decade bid rough about alarm wreck season sting'

describe('lisk-utils', () => {
  describe('getAccount', () => {
    it('should generate account from passphrase', () => {
      expect(getAccount(Cryptos.KLY, passphrase)).toMatchSnapshot()
    })
  })

  describe('estimateFee', () => {
    it('should calculate fee including `data`', () => {
      const data = 'hello'
      const minimalFee = BigInt(165000)
      const messageFee = BigInt(data.length) * BigInt(KLY_MIN_FEE_PER_BYTE)
      const expectedFee = minimalFee + messageFee

      expect(estimateFee({ data })).toBe(convertBeddowsTokly(expectedFee.toString()))
    })
  })
})
