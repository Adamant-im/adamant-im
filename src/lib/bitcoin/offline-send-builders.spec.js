import { afterEach, describe, expect, it, vi } from 'vitest'
import * as bitcoin from 'bitcoinjs-lib'
import { Buffer } from 'buffer'

const TEST_PUBLIC_KEY = Buffer.from(
  '034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa',
  'hex'
)

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({
    fromPrivateKey: () => ({
      publicKey: TEST_PUBLIC_KEY
    }),
    fromPublicKey: () => ({
      verify: () => true
    })
  })
}))

vi.mock('tiny-secp256k1', () => ({}))

vi.mock('bitcoinjs-lib', async () => {
  const actual = await vi.importActual('bitcoinjs-lib')

  class FakePsbt {
    constructor({ network }) {
      this.network = network
      this.inputs = []
      this.outputs = []
    }

    setVersion() {}

    setMaximumFeeRate() {}

    addInput(input) {
      this.inputs.push(input)
    }

    addOutput(output) {
      this.outputs.push(output)
    }

    signInput() {}

    validateSignaturesOfInput() {
      return true
    }

    finalizeAllInputs() {}

    extractTransaction() {
      const tx = new actual.Transaction()

      tx.version = 1
      this.inputs.forEach(() => tx.addInput(Buffer.alloc(32, 1), 0))
      this.outputs.forEach(({ address, value }) => {
        tx.addOutput(
          actual.address.toOutputScript(address, this.network),
          typeof value === 'bigint' ? value : BigInt(value)
        )
      })

      return tx
    }
  }

  return {
    ...actual,
    crypto: {
      ...actual.crypto,
      sha256(value) {
        return Buffer.from(actual.crypto.sha256(value))
      }
    },
    Psbt: FakePsbt
  }
})

import BitcoinApi from './bitcoin-api'
import DogeApi from './doge-api'
import DashApi from './dash-api'
import networks from './networks'
import validateAddress from '@/lib/validateAddress'
import { Cryptos } from '@/lib/constants'

const TEST_ACCOUNT_PASSPHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

function createRecipientAddresses(crypto) {
  if (crypto === Cryptos.BTC) {
    return [
      ['p2pkh', '1Q1pE5vPGEEMqRcVRMbtBK842Y6Pzo6nK9'],
      ['p2sh', '3PFpzMLrKWsphFtc8BesF3MGPnimKMuF4x'],
      ['p2wpkh', 'bc1ql3e9pgs3mmwuwrh95fecme0s0qtn2880lsvsd5']
    ]
  }

  return [
    crypto === Cryptos.DOGE
      ? ['p2pkh', 'DU9umLs2Ze8eNRo69wbSj5HeufphJawFPh']
      : ['p2pkh', 'Xyhf4LaHDwSwzND5HEv72qoqrsg625rCMt'],
    crypto === Cryptos.DOGE
      ? ['p2sh', 'ABhQshCgMtU4f7g6Uqr51Tjv96HMQKRDFq']
      : ['p2sh', '7mfny3Qx6ogokWqaLKrA6i7CN4jh9dsPqy']
  ]
}

function createFundingUtxo(address, network, amount) {
  const tx = new bitcoin.Transaction()

  tx.version = 1
  tx.addInput(Buffer.alloc(32, 1), 0)
  tx.addOutput(bitcoin.address.toOutputScript(address, network), BigInt(amount))

  return {
    txHex: tx.toHex(),
    txid: tx.getId(),
    amount,
    vout: 0
  }
}

function decodeOutputs(hex, network) {
  const transaction = bitcoin.Transaction.fromHex(hex)

  return transaction.outs.map((output) => ({
    address: bitcoin.address.fromOutputScript(output.script, network),
    value: output.value
  }))
}

async function expectOfflineTransfer({
  api,
  crypto,
  recipientAddress,
  amount,
  fee,
  fundingAmount,
  extraMocks = () => {}
}) {
  const fundingUtxo = createFundingUtxo(api.address, networks[crypto], fundingAmount)

  vi.spyOn(api, 'getUnspents').mockResolvedValue([fundingUtxo])
  vi.spyOn(api, 'getTransactionHex').mockResolvedValue(fundingUtxo.txHex)
  extraMocks(api)

  const transaction = await api.createTransaction(recipientAddress, amount, fee)
  const outputs = decodeOutputs(transaction.hex, networks[crypto])

  expect(validateAddress(crypto, recipientAddress)).toBe(true)
  expect(transaction.txid).toMatch(/^[0-9a-f]{64}$/)
  expect(outputs[0]).toEqual({
    address: recipientAddress,
    value: BigInt(Math.floor(amount * 1e8))
  })
  expect(outputs[1]).toEqual({
    address: api.address,
    value: BigInt(fundingAmount - Math.floor((amount + fee) * 1e8))
  })
}

describe('offline bitcoin-like send builders', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(createRecipientAddresses(Cryptos.BTC))(
    'builds a signed BTC transaction for %s recipients',
    async (_type, recipientAddress) => {
      const api = new BitcoinApi(TEST_ACCOUNT_PASSPHRASE)

      await expectOfflineTransfer({
        api,
        crypto: Cryptos.BTC,
        recipientAddress,
        amount: 0.0001,
        fee: 0.00001,
        fundingAmount: 50_000
      })
    }
  )

  it.each(createRecipientAddresses(Cryptos.DOGE))(
    'builds a signed DOGE transaction for %s recipients',
    async (_type, recipientAddress) => {
      const api = new DogeApi(TEST_ACCOUNT_PASSPHRASE)

      await expectOfflineTransfer({
        api,
        crypto: Cryptos.DOGE,
        recipientAddress,
        amount: 1.5,
        fee: 1,
        fundingAmount: 500_000_000,
        extraMocks: () => {
          vi.spyOn(api, 'getFeePerByte').mockResolvedValue(1)
        }
      })
    }
  )

  it.each(createRecipientAddresses(Cryptos.DASH))(
    'builds a signed DASH transaction for %s recipients',
    async (_type, recipientAddress) => {
      const api = new DashApi(TEST_ACCOUNT_PASSPHRASE)

      await expectOfflineTransfer({
        api,
        crypto: Cryptos.DASH,
        recipientAddress,
        amount: 0.01,
        fee: 0.0001,
        fundingAmount: 5_000_000
      })
    }
  )
})
