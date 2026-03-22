import { beforeEach, describe, expect, it, vi } from 'vitest'

const addOutputMock = vi.fn()

vi.mock('bitcoinjs-lib', () => ({
  Psbt: class {
    setVersion() {}

    addInput() {}

    addOutput(output) {
      addOutputMock(output)
    }

    signInput() {}

    finalizeAllInputs() {}

    extractTransaction() {
      return {
        toHex: () => 'deadbeef'
      }
    }
  }
}))

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({})
}))

vi.mock('tiny-secp256k1', () => ({}))

import BtcBaseApi from './btc-base-api'

describe('BtcBaseApi.buildTransaction', () => {
  beforeEach(() => {
    addOutputMock.mockClear()
  })

  it('uses bigint outputs for bitcoinjs-lib v7 compatible BTC transactions', () => {
    const api = Object.create(BtcBaseApi.prototype)
    api._network = {}
    api._keyPair = {}
    api._address = '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'

    api.buildTransaction(
      'bc1q35029naja6jpazkefs328varxvr0kjm69r9wcv',
      0.0000261,
      [
        {
          txid: 'a'.repeat(64),
          amount: 6000,
          vout: 0,
          txHex: '00'
        }
      ],
      0.00002525
    )

    expect(addOutputMock).toHaveBeenCalledTimes(2)
    expect(addOutputMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        address: 'bc1q35029naja6jpazkefs328varxvr0kjm69r9wcv',
        value: 2610n
      })
    )
    expect(addOutputMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        address: '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
        value: 865n
      })
    )
  })

  it('calculates normalized BTC-like fees without floating-point drift', () => {
    const api = Object.create(BtcBaseApi.prototype)
    api._address = 'Xowner'

    const normalized = api._mapTransaction({
      txid: 'b'.repeat(64),
      vin: [
        {
          address: 'Xowner',
          value: 0.0014
        }
      ],
      vout: [
        {
          value: 0.0013,
          scriptPubKey: {
            addresses: ['Xrecipient']
          }
        }
      ],
      confirmations: 0,
      time: 1,
      height: 1
    })

    expect(normalized.fee).toBe(0.0001)
  })
})
