// @vitest-environment node

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { config as loadEnv } from 'dotenv'
import BigNumber from 'bignumber.js'
import * as bitcoin from 'bitcoinjs-lib'
import EthContract from 'web3-eth-contract'
import { signTransaction, TransactionFactory } from 'web3-eth-accounts'

vi.hoisted(() => {
  const storage = new Map()
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  }

  globalThis.window = {
    localStorage
  }
  globalThis.localStorage = localStorage
  globalThis.location = {
    protocol: 'https:'
  }
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    configurable: true
  })
})

vi.unmock('@/lib/nodes')
vi.unmock('@/lib/nodes/adm/index')
vi.unmock('@/lib/nodes/eth/index')
vi.unmock('@/lib/nodes/btc-indexer/index')

import adamant from '@/lib/adamant'
import BitcoinApi from '@/lib/bitcoin/bitcoin-api'
import DogeApi from '@/lib/bitcoin/doge-api'
import DashApi from '@/lib/bitcoin/dash-api'
import networks from '@/lib/bitcoin/networks'
import validateAddress from '@/lib/validateAddress'
import btcGetters from '@/store/modules/btc/btc-getters'
import eth from '@/lib/nodes/eth'
import adm from '@/lib/nodes/adm'
import { getAccountFromPassphrase, calculateReliableValue, calculateFee } from '@/lib/eth-utils'
import Erc20 from '@/store/modules/erc20/erc20.abi.json'
import { Cryptos, CryptosInfo, Fees, Transactions, getMinAmount } from '@/lib/constants'

loadEnv({ path: '.env.local', quiet: true })

const testPassphrase = process.env.ADM_TEST_ACCOUNT_PK?.trim()
const liveDescribe = testPassphrase ? describe : describe.skip

if (!process.env.CI && !testPassphrase) {
  console.warn(
    '\n[vitest] ADM_TEST_ACCOUNT_PK is not set — live wallet build tests will be skipped.\n' +
      'To enable them, add the test account passphrase to .env.local.\n'
  )
}

const ADM_RECIPIENT = 'U12345678901234567890'
const ETH_RECIPIENT = '0x000000000000000000000000000000000000dEaD'
const BTC_RECIPIENTS = {
  p2pkh: '1Q1pE5vPGEEMqRcVRMbtBK842Y6Pzo6nK9',
  p2sh: '3PFpzMLrKWsphFtc8BesF3MGPnimKMuF4x',
  p2wpkh: 'bc1ql3e9pgs3mmwuwrh95fecme0s0qtn2880lsvsd5'
}
const DOGE_RECIPIENTS = {
  p2pkh: 'DU9umLs2Ze8eNRo69wbSj5HeufphJawFPh',
  p2sh: 'ABhQshCgMtU4f7g6Uqr51Tjv96HMQKRDFq'
}
const DASH_RECIPIENTS = {
  p2pkh: 'Xyhf4LaHDwSwzND5HEv72qoqrsg625rCMt',
  p2sh: '7mfny3Qx6ogokWqaLKrA6i7CN4jh9dsPqy'
}
const INVALID_ADDRESS = 'not-a-valid-address'
const SATOSHI_MULTIPLIER = 1e8

function decimalPlacesFor(crypto) {
  return CryptosInfo[crypto].cryptoTransferDecimals
}

function toFixedAmount(value, decimals = 8) {
  return new BigNumber(value).decimalPlaces(decimals, BigNumber.ROUND_DOWN).toFixed()
}

function toSmallestUnit(amount, multiplier = SATOSHI_MULTIPLIER) {
  return BigInt(
    new BigNumber(amount).times(multiplier).integerValue(BigNumber.ROUND_DOWN).toFixed(0)
  )
}

function decodeOutputs(hex, network) {
  const transaction = bitcoin.Transaction.fromHex(hex)

  return transaction.outs.map((output) => ({
    address: bitcoin.address.fromOutputScript(output.script, network),
    value: output.value
  }))
}

function solveMaxSendable(balance, feeCalculator, decimals) {
  let amount = new BigNumber(balance)

  for (let i = 0; i < 12; i++) {
    const fee = new BigNumber(feeCalculator(amount.toFixed()))
    amount = new BigNumber(balance).minus(fee)
  }

  return amount.decimalPlaces(decimals, BigNumber.ROUND_DOWN).toFixed()
}

async function fetchLiveUnspents(api) {
  const unspents = await api.getUnspents()

  return Promise.all(
    unspents.map(async (unspent) => ({
      ...unspent,
      txHex: await api.getTransactionHex(unspent.txid)
    }))
  )
}

function useCachedUnspents(api, cachedUnspents) {
  const txHexById = new Map(cachedUnspents.map((unspent) => [unspent.txid, unspent.txHex]))
  const getUnspentsSpy = vi
    .spyOn(api, 'getUnspents')
    .mockResolvedValue(cachedUnspents.map(({ txHex: _txHex, ...rest }) => ({ ...rest })))
  const getTransactionHexSpy = vi
    .spyOn(api, 'getTransactionHex')
    .mockImplementation(async (txid) => txHexById.get(txid))

  return () => {
    getUnspentsSpy.mockRestore()
    getTransactionHexSpy.mockRestore()
  }
}

function createAdmTransfer({ keypair, senderId, recipientId, amount }) {
  const transaction = {
    type: Transactions.SEND,
    amount: adamant.prepareAmount(amount),
    senderId,
    recipientId,
    senderPublicKey: Buffer.from(keypair.publicKey).toString('hex')
  }

  transaction.timestamp = adamant.epochTime()
  transaction.signature = Buffer.from(adamant.transactionSign(transaction, keypair)).toString('hex')

  return transaction
}

async function buildEthTransfer({
  client,
  account,
  recipient,
  amount,
  increaseFee,
  gasPriceWei,
  nonce
}) {
  const ethInfo = CryptosInfo.ETH
  const gasPrice = calculateReliableValue(
    gasPriceWei.toString(),
    ethInfo.reliabilityGasPricePercent,
    increaseFee,
    ethInfo.increasedGasPricePercent
  )
    .integerValue()
    .toFixed(0)

  const transaction = {
    from: account.address,
    to: recipient,
    value: toSmallestUnit(amount, 1e18),
    gasPrice: BigInt(gasPrice),
    nonce
  }

  const estimatedGas = await client.estimateGas(transaction)
  const gasLimit = calculateReliableValue(estimatedGas, ethInfo.reliabilityGasLimitPercent)
    .integerValue()
    .toFixed(0)
  transaction.gasLimit = BigInt(gasLimit)

  const signed = await signTransaction(
    TransactionFactory.fromTxData(transaction),
    account.privateKey
  )

  return {
    transaction,
    signed,
    feeEth: calculateFee(transaction.gasLimit.toString(), transaction.gasPrice.toString())
  }
}

async function buildUsdtTransfer({
  client,
  account,
  recipient,
  amount,
  increaseFee,
  gasPriceWei,
  nonce,
  contractAddress,
  decimals
}) {
  const ethInfo = CryptosInfo.ETH
  const tokenInfo = CryptosInfo.USDT
  const contract = new EthContract(Erc20, contractAddress)

  const gasPrice = calculateReliableValue(
    gasPriceWei.toString(),
    tokenInfo.reliabilityGasPricePercent ?? ethInfo.reliabilityGasPricePercent,
    increaseFee,
    tokenInfo.increasedGasPricePercent ?? ethInfo.increasedGasPricePercent
  )
    .integerValue()
    .toFixed(0)

  const amountWhole = new BigNumber(amount)
    .times(new BigNumber(10).pow(decimals))
    .integerValue(BigNumber.ROUND_DOWN)
    .toFixed(0)

  const transaction = {
    from: account.address,
    to: contractAddress,
    value: '0x0',
    gasPrice: BigInt(gasPrice),
    nonce,
    data: contract.methods.transfer(recipient, amountWhole).encodeABI()
  }

  const estimatedGas = await client.estimateGas(transaction)
  const gasLimit = calculateReliableValue(
    estimatedGas,
    tokenInfo.reliabilityGasLimitPercent ?? ethInfo.reliabilityGasLimitPercent
  )
    .integerValue()
    .toFixed(0)
  transaction.gasLimit = BigInt(gasLimit)

  const signed = await signTransaction(
    TransactionFactory.fromTxData(transaction),
    account.privateKey
  )

  return {
    transaction,
    signed,
    feeEth: calculateFee(transaction.gasLimit.toString(), transaction.gasPrice.toString())
  }
}

liveDescribe('live no-broadcast send builders from ADM_TEST_ACCOUNT_PK', () => {
  const live = {
    adm: {},
    btc: {},
    doge: {},
    dash: {},
    eth: {},
    usdt: {}
  }

  beforeAll(async () => {
    const admHash = adamant.createPassphraseHash(testPassphrase)
    const admKeypair = adamant.makeKeypair(admHash)
    const admAddress = adamant.getAddressFromPublicKey(admKeypair.publicKey)
    const admAccount = await adm.get('/api/accounts', {
      publicKey: Buffer.from(admKeypair.publicKey).toString('hex')
    })

    expect(admAccount.success).toBe(true)
    live.adm = {
      keypair: admKeypair,
      address: admAddress,
      balance: Number(adamant.toAdm(admAccount.account.balance))
    }

    const btcApi = new BitcoinApi(testPassphrase)
    const btcBalance = await btcApi.getBalance()
    const btcFeeRate = await btcApi.getFeeRate()
    const btcUnspents = await fetchLiveUnspents(btcApi)
    live.btc = {
      api: btcApi,
      balance: btcBalance,
      feeRate: btcFeeRate,
      unspents: btcUnspents
    }

    const dogeApi = new DogeApi(testPassphrase)
    const dogeBalance = await dogeApi.getBalance()
    const dogeFeePerByte = await dogeApi.getFeePerByte()
    const dogeUnspents = await fetchLiveUnspents(dogeApi)
    live.doge = {
      api: dogeApi,
      balance: dogeBalance,
      feePerByte: dogeFeePerByte,
      unspents: dogeUnspents
    }

    const dashApi = new DashApi(testPassphrase)
    const dashBalance = await dashApi.getBalance()
    const dashUnspents = await fetchLiveUnspents(dashApi)
    live.dash = {
      api: dashApi,
      balance: dashBalance,
      unspents: dashUnspents
    }

    const ethAccount = getAccountFromPassphrase(testPassphrase, eth)
    const ethClient = eth.getClient()
    const ethBalanceWei = await ethClient.getBalance(ethAccount.address, 'latest')
    const gasPriceWei = await ethClient.getGasPrice()
    const nonce = await ethClient.getTransactionCount(ethAccount.address)

    const usdtContract = new EthContract(Erc20, CryptosInfo.USDT.contractId)
    usdtContract.setProvider(ethClient.provider)
    const usdtBalanceRaw = await usdtContract.methods.balanceOf(ethAccount.address).call()

    live.eth = {
      account: ethAccount,
      client: ethClient,
      balanceEth: new BigNumber(ethBalanceWei.toString()).div(1e18).toFixed(),
      gasPriceWei: BigInt(gasPriceWei.toString()),
      nonce: BigInt(nonce.toString())
    }
    live.usdt = {
      contractAddress: CryptosInfo.USDT.contractId,
      decimals: CryptosInfo.USDT.decimals,
      balance: new BigNumber(usdtBalanceRaw.toString())
        .div(new BigNumber(10).pow(CryptosInfo.USDT.decimals))
        .toFixed()
    }
  }, 120000)

  describe('ADM', () => {
    it('builds a minTransferAmount ADM transaction from the real test account', () => {
      const amount = getMinAmount(Cryptos.ADM)
      expect(live.adm.balance).toBeGreaterThan(amount + Fees.ADM_TRANSFER)

      const transaction = createAdmTransfer({
        keypair: live.adm.keypair,
        senderId: live.adm.address,
        recipientId: ADM_RECIPIENT,
        amount
      })

      expect(transaction.amount).toBe(adamant.prepareAmount(amount))
      expect(transaction.senderId).toBe(live.adm.address)
      expect(transaction.recipientId).toBe(ADM_RECIPIENT)
      expect(transaction.signature).toMatch(/^[0-9a-f]+$/)
    })

    it('builds a 50% ADM balance transaction from the real test account', () => {
      const amount = toFixedAmount(
        new BigNumber(live.adm.balance).div(2),
        decimalPlacesFor(Cryptos.ADM)
      )
      expect(live.adm.balance).toBeGreaterThan(
        new BigNumber(amount).plus(Fees.ADM_TRANSFER).toNumber()
      )

      const transaction = createAdmTransfer({
        keypair: live.adm.keypair,
        senderId: live.adm.address,
        recipientId: ADM_RECIPIENT,
        amount
      })

      expect(transaction.amount).toBe(adamant.prepareAmount(amount))
    })

    it('builds a 100% ADM spendable balance transaction with fee reserved', () => {
      const amount = toFixedAmount(
        new BigNumber(live.adm.balance).minus(Fees.ADM_TRANSFER),
        decimalPlacesFor(Cryptos.ADM)
      )
      expect(new BigNumber(amount).toNumber()).toBeGreaterThanOrEqual(getMinAmount(Cryptos.ADM))

      const transaction = createAdmTransfer({
        keypair: live.adm.keypair,
        senderId: live.adm.address,
        recipientId: ADM_RECIPIENT,
        amount
      })

      expect(transaction.amount).toBe(adamant.prepareAmount(amount))
    })

    it('rejects invalid ADM recipient parameters at validation stage', () => {
      expect(validateAddress(Cryptos.ADM, INVALID_ADDRESS)).toBe(false)
    })
  })

  describe('BTC', () => {
    const feeForAmount = (amount, increaseFee) =>
      Number(
        btcGetters.fee({ utxo: live.btc.unspents, feeRate: live.btc.feeRate })(
          amount,
          '',
          '',
          false,
          increaseFee
        )
      )

    it.each(Object.entries(BTC_RECIPIENTS))(
      'builds a minTransferAmount BTC transaction to %s using live UTXO and fee data',
      async (_label, recipient) => {
        const restore = useCachedUnspents(live.btc.api, live.btc.unspents)
        const amount = getMinAmount(Cryptos.BTC)
        const fee = feeForAmount(amount, false)

        expect(live.btc.balance).toBeGreaterThan(amount + fee)

        const transaction = await live.btc.api.createTransaction(recipient, amount, fee)
        const outputs = decodeOutputs(transaction.hex, networks[Cryptos.BTC])

        expect(validateAddress(Cryptos.BTC, recipient)).toBe(true)
        expect(transaction.txid).toMatch(/^[0-9a-f]{64}$/)
        expect(outputs[0]).toEqual({ address: recipient, value: toSmallestUnit(amount) })

        restore()
      },
      120000
    )

    it('builds 50% BTC balance transactions with Increase fee off and on', async () => {
      const restore = useCachedUnspents(live.btc.api, live.btc.unspents)
      const amount = toFixedAmount(
        new BigNumber(live.btc.balance).div(2),
        decimalPlacesFor(Cryptos.BTC)
      )
      const feeOff = feeForAmount(amount, false)
      const feeOn = feeForAmount(amount, true)

      const txOff = await live.btc.api.createTransaction(BTC_RECIPIENTS.p2wpkh, amount, feeOff)
      const txOn = await live.btc.api.createTransaction(BTC_RECIPIENTS.p2wpkh, amount, feeOn)
      const outputsOff = decodeOutputs(txOff.hex, networks[Cryptos.BTC])
      const outputsOn = decodeOutputs(txOn.hex, networks[Cryptos.BTC])

      expect(new BigNumber(live.btc.balance).toNumber()).toBeGreaterThan(Number(amount) + feeOn)
      expect(feeOn).toBeGreaterThan(feeOff)
      expect(outputsOff[0].value).toBe(toSmallestUnit(amount))
      expect(outputsOn[0].value).toBe(toSmallestUnit(amount))

      restore()
    }, 120000)

    it('builds a 100% BTC spendable balance transaction with live fee reserved', async () => {
      const restore = useCachedUnspents(live.btc.api, live.btc.unspents)
      const amount = solveMaxSendable(live.btc.balance, (value) => feeForAmount(value, false), 8)
      const fee = feeForAmount(amount, false)
      const transaction = await live.btc.api.createTransaction(BTC_RECIPIENTS.p2pkh, amount, fee)
      const outputs = decodeOutputs(transaction.hex, networks[Cryptos.BTC])

      expect(new BigNumber(amount).toNumber()).toBeGreaterThanOrEqual(getMinAmount(Cryptos.BTC))
      expect(outputs[0].value).toBe(toSmallestUnit(amount))

      restore()
    }, 120000)

    it('throws on invalid BTC recipient parameters without broadcasting', async () => {
      const restore = useCachedUnspents(live.btc.api, live.btc.unspents)

      await expect(
        live.btc.api.createTransaction(
          INVALID_ADDRESS,
          getMinAmount(Cryptos.BTC),
          feeForAmount(getMinAmount(Cryptos.BTC), false)
        )
      ).rejects.toThrow()

      restore()
    }, 120000)
  })

  describe('DOGE', () => {
    const fee = CryptosInfo.DOGE.fixedFee

    it.each(Object.entries(DOGE_RECIPIENTS))(
      'builds a minTransferAmount DOGE transaction to %s using live node data',
      async (_label, recipient) => {
        const restore = useCachedUnspents(live.doge.api, live.doge.unspents)
        const amount = getMinAmount(Cryptos.DOGE)

        expect(live.doge.feePerByte).toBeGreaterThan(0)
        expect(live.doge.balance).toBeGreaterThan(amount + fee)

        const transaction = await live.doge.api.createTransaction(recipient, amount, fee)
        const outputs = decodeOutputs(transaction.hex, networks[Cryptos.DOGE])

        expect(validateAddress(Cryptos.DOGE, recipient)).toBe(true)
        expect(outputs[0].value).toBe(toSmallestUnit(amount))

        restore()
      },
      120000
    )

    it('builds 50% and 100% spendable DOGE transactions from live wallet state', async () => {
      const restore = useCachedUnspents(live.doge.api, live.doge.unspents)
      const halfAmount = toFixedAmount(
        new BigNumber(live.doge.balance).div(2),
        decimalPlacesFor(Cryptos.DOGE)
      )
      const fullAmount = toFixedAmount(
        new BigNumber(live.doge.balance).minus(fee),
        decimalPlacesFor(Cryptos.DOGE)
      )

      const halfTx = await live.doge.api.createTransaction(DOGE_RECIPIENTS.p2pkh, halfAmount, fee)
      const fullTx = await live.doge.api.createTransaction(DOGE_RECIPIENTS.p2sh, fullAmount, fee)

      expect(decodeOutputs(halfTx.hex, networks[Cryptos.DOGE])[0].value).toBe(
        toSmallestUnit(halfAmount)
      )
      expect(decodeOutputs(fullTx.hex, networks[Cryptos.DOGE])[0].value).toBe(
        toSmallestUnit(fullAmount)
      )

      restore()
    }, 120000)

    it('throws on invalid DOGE recipient parameters without broadcasting', async () => {
      const restore = useCachedUnspents(live.doge.api, live.doge.unspents)

      await expect(
        live.doge.api.createTransaction(INVALID_ADDRESS, getMinAmount(Cryptos.DOGE), fee)
      ).rejects.toThrow()

      restore()
    }, 120000)
  })

  describe('DASH', () => {
    const fee = CryptosInfo.DASH.fixedFee

    it.each(Object.entries(DASH_RECIPIENTS))(
      'builds a minTransferAmount DASH transaction to %s using live node data',
      async (_label, recipient) => {
        const restore = useCachedUnspents(live.dash.api, live.dash.unspents)
        const amount = getMinAmount(Cryptos.DASH)

        expect(live.dash.balance).toBeGreaterThan(amount + fee)

        const transaction = await live.dash.api.createTransaction(recipient, amount, fee)
        const outputs = decodeOutputs(transaction.hex, networks[Cryptos.DASH])

        expect(validateAddress(Cryptos.DASH, recipient)).toBe(true)
        expect(outputs[0].value).toBe(toSmallestUnit(amount))

        restore()
      },
      120000
    )

    it('builds 50% and 100% spendable DASH transactions from live wallet state', async () => {
      const restore = useCachedUnspents(live.dash.api, live.dash.unspents)
      const halfAmount = toFixedAmount(
        new BigNumber(live.dash.balance).div(2),
        decimalPlacesFor(Cryptos.DASH)
      )
      const fullAmount = toFixedAmount(
        new BigNumber(live.dash.balance).minus(fee),
        decimalPlacesFor(Cryptos.DASH)
      )

      const halfTx = await live.dash.api.createTransaction(DASH_RECIPIENTS.p2pkh, halfAmount, fee)
      const fullTx = await live.dash.api.createTransaction(DASH_RECIPIENTS.p2sh, fullAmount, fee)

      expect(decodeOutputs(halfTx.hex, networks[Cryptos.DASH])[0].value).toBe(
        toSmallestUnit(halfAmount)
      )
      expect(decodeOutputs(fullTx.hex, networks[Cryptos.DASH])[0].value).toBe(
        toSmallestUnit(fullAmount)
      )

      restore()
    }, 120000)

    it('throws on invalid DASH recipient parameters without broadcasting', async () => {
      const restore = useCachedUnspents(live.dash.api, live.dash.unspents)

      await expect(
        live.dash.api.createTransaction(INVALID_ADDRESS, getMinAmount(Cryptos.DASH), fee)
      ).rejects.toThrow()

      restore()
    }, 120000)
  })

  describe('ETH', () => {
    it('builds a minTransferAmount ETH transaction from live balance and gas data', async () => {
      const amount = getMinAmount(Cryptos.ETH)
      const { transaction, signed, feeEth } = await buildEthTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount,
        increaseFee: false,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce
      })

      expect(new BigNumber(live.eth.balanceEth).toNumber()).toBeGreaterThan(amount + Number(feeEth))
      expect(transaction.to).toBe(ETH_RECIPIENT)
      expect(transaction.value).toBe(toSmallestUnit(amount, 1e18))
      expect(signed.transactionHash).toMatch(/^0x[0-9a-f]{64}$/)
    }, 120000)

    it('builds 50% ETH balance transactions with Increase fee off and on', async () => {
      const amount = toFixedAmount(
        new BigNumber(live.eth.balanceEth).div(2),
        decimalPlacesFor(Cryptos.ETH)
      )
      const txOff = await buildEthTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount,
        increaseFee: false,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce
      })
      const txOn = await buildEthTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount,
        increaseFee: true,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce
      })

      expect(BigInt(txOn.transaction.gasPrice)).toBeGreaterThan(BigInt(txOff.transaction.gasPrice))
      expect(txOff.transaction.value).toBe(toSmallestUnit(amount, 1e18))
      expect(txOn.transaction.value).toBe(toSmallestUnit(amount, 1e18))
    }, 120000)

    it('builds a 100% ETH spendable balance transaction with fee reserved', async () => {
      const feeProbe = await buildEthTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount: getMinAmount(Cryptos.ETH),
        increaseFee: false,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce
      })
      const amount = toFixedAmount(
        new BigNumber(live.eth.balanceEth).minus(feeProbe.feeEth),
        decimalPlacesFor(Cryptos.ETH)
      )
      const transaction = await buildEthTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount,
        increaseFee: false,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce
      })

      expect(new BigNumber(amount).toNumber()).toBeGreaterThanOrEqual(getMinAmount(Cryptos.ETH))
      expect(transaction.transaction.value).toBe(toSmallestUnit(amount, 1e18))
    }, 120000)

    it('throws on invalid ETH recipient parameters without broadcasting', async () => {
      expect(validateAddress(Cryptos.ETH, INVALID_ADDRESS)).toBe(false)

      await expect(
        buildEthTransfer({
          client: live.eth.client,
          account: live.eth.account,
          recipient: INVALID_ADDRESS,
          amount: getMinAmount(Cryptos.ETH),
          increaseFee: false,
          gasPriceWei: live.eth.gasPriceWei,
          nonce: live.eth.nonce
        })
      ).rejects.toThrow()
    }, 120000)
  })

  describe('USDT', () => {
    it('builds a minTransferAmount USDT transaction from live balances and gas data', async () => {
      const amount = getMinAmount(Cryptos.USDT)
      const { transaction, signed, feeEth } = await buildUsdtTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount,
        increaseFee: false,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce,
        contractAddress: live.usdt.contractAddress,
        decimals: live.usdt.decimals
      })

      expect(new BigNumber(live.usdt.balance).toNumber()).toBeGreaterThanOrEqual(amount)
      expect(new BigNumber(live.eth.balanceEth).toNumber()).toBeGreaterThan(Number(feeEth))
      expect(transaction.to).toBe(live.usdt.contractAddress)
      expect(transaction.data).toMatch(/^0xa9059cbb/)
      expect(signed.transactionHash).toMatch(/^0x[0-9a-f]{64}$/)
    }, 120000)

    it('builds 50% USDT balance transactions with Increase fee off and on', async () => {
      const amount = toFixedAmount(
        new BigNumber(live.usdt.balance).div(2),
        decimalPlacesFor(Cryptos.USDT)
      )
      const txOff = await buildUsdtTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount,
        increaseFee: false,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce,
        contractAddress: live.usdt.contractAddress,
        decimals: live.usdt.decimals
      })
      const txOn = await buildUsdtTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount,
        increaseFee: true,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce,
        contractAddress: live.usdt.contractAddress,
        decimals: live.usdt.decimals
      })

      expect(BigInt(txOn.transaction.gasPrice)).toBeGreaterThan(BigInt(txOff.transaction.gasPrice))
      expect(txOff.transaction.data).toMatch(/^0xa9059cbb/)
      expect(txOn.transaction.data).toMatch(/^0xa9059cbb/)
    }, 120000)

    it('builds a 100% USDT balance transaction while keeping ETH fee external', async () => {
      const transaction = await buildUsdtTransfer({
        client: live.eth.client,
        account: live.eth.account,
        recipient: ETH_RECIPIENT,
        amount: live.usdt.balance,
        increaseFee: false,
        gasPriceWei: live.eth.gasPriceWei,
        nonce: live.eth.nonce,
        contractAddress: live.usdt.contractAddress,
        decimals: live.usdt.decimals
      })

      expect(new BigNumber(live.eth.balanceEth).toNumber()).toBeGreaterThan(
        Number(transaction.feeEth)
      )
      expect(transaction.transaction.data).toMatch(/^0xa9059cbb/)
    }, 120000)

    it('throws on invalid USDT recipient parameters without broadcasting', async () => {
      expect(validateAddress(Cryptos.USDT, INVALID_ADDRESS)).toBe(false)

      await expect(
        buildUsdtTransfer({
          client: live.eth.client,
          account: live.eth.account,
          recipient: INVALID_ADDRESS,
          amount: getMinAmount(Cryptos.USDT),
          increaseFee: false,
          gasPriceWei: live.eth.gasPriceWei,
          nonce: live.eth.nonce,
          contractAddress: live.usdt.contractAddress,
          decimals: live.usdt.decimals
        })
      ).rejects.toThrow()
    }, 120000)
  })
})
