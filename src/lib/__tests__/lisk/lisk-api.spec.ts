// @vitest-environment node
// Some crypto libs throw errors when using `jsdom` environment

import { describe, expect, it } from 'vitest'
import * as cryptography from '@liskhq/lisk-cryptography'
import LiskApi, { getAccount } from '@/lib/lisk/lisk-api'

describe('lisk-api', () => {
  const passphrase = 'joy mouse injury soft decade bid rough about alarm wreck season sting'
  const lskAddress = 'lskkjurzk3xb47scma49ukyqupn8vrg2ggyuehk5j'

  it('createTransaction', async () => {
    const api = new LiskApi(passphrase)

    const transaction = await api.createTransaction(lskAddress, 1, 0.00141, 3)

    expect(transaction).toMatchSnapshot()
  })

  it('lisk.cryptography.getAddressFromBase32Address', () => {
    expect(cryptography.address.getAddressFromLisk32Address(lskAddress)).toMatchSnapshot()
  })

  it('lisk.cryptography.validateBase32Address', () => {
    expect(cryptography.address.validateLisk32Address(lskAddress)).toBe(true)
  })
})
