// @vitest-environment node
// Some crypto libs throw errors when using `jsdom` environment

import { describe, it, expect } from 'vitest'
import { Cryptos } from '@/lib/constants'
import { getAccount } from '@/lib/lisk/lisk-utils'

const passphrase = 'joy mouse injury soft decade bid rough about alarm wreck season sting'

describe('lisk-utils', () => {
  describe('getAccount', () => {
    it('should generate account from passphrase', () => {
      expect(getAccount(Cryptos.LSK, passphrase)).toMatchSnapshot()
    })
  })
})
