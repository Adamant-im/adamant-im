// @vitest-environment node
// Some crypto libs throw errors when using `jsdom` environment

import { LSK_MIN_FEE_PER_BYTE } from '@/lib/lisk'
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
    it('should calculate fee including `data`', () => {
      const data = 'hello'
      const minimalFee = BigInt(165000)
      const messageFee = BigInt(data.length) * BigInt(LSK_MIN_FEE_PER_BYTE)
      const expectedFee = minimalFee + messageFee

      expect(estimateFee({ data })).toBe(convertBeddowsToLSK(expectedFee.toString()))
    })
  })
})
