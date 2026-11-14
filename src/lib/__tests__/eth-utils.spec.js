// @vitest-environment node
// Some crypto libs throw errors when using `jsdom` environment

import { describe, it, expect, vi } from 'vitest'
import Web3Eth from 'web3-eth'
import { decodeParameters, encodeParameters } from 'web3-eth-abi'
import { validator, Web3ValidatorError } from 'web3-validator'
import { toEther, toWei, getAccountFromPassphrase, calculateFee } from '@/lib/eth-utils'
import { bytesToHex } from '@/lib/hex'
import cache from '@/store/cache'

describe('eth-utils', () => {
  it('validates Ethereum RPC addresses before calling the provider', async () => {
    const request = vi.fn().mockResolvedValue('0x2a')
    const api = new Web3Eth({ request })
    const address = '0x000000000000000000000000000000000000dEaD'

    await expect(api.getBalance(address)).resolves.toBe(42n)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toMatchObject({
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
    request.mockClear()

    await expect(api.getBalance('invalid address')).rejects.toBeInstanceOf(Web3ValidatorError)
    expect(request).not.toHaveBeenCalled()
  })

  it('round-trips a human-readable ABI tuple', () => {
    const types = ['(address recipient, uint256 amount)']
    const address = '0x000000000000000000000000000000000000dEaD'
    const encoded = encodeParameters(types, [[address, 42n]])

    expect(decodeParameters(types, encoded)[0]).toMatchObject({ recipient: address, amount: 42n })
  })

  it.each([
    ['address', '0x000000000000000000000000000000000000dEaD', '0x1234'],
    ['uint256', 2n ** 256n - 1n, 2n ** 256n],
    ['bytes32', `0x${'ab'.repeat(32)}`, `0x${'ab'.repeat(31)}`],
    ['blockNumberOrTag', 'finalized', 'invalid']
  ])('preserves Web3.js acceptance and rejection for %s', (type, valid, invalid) => {
    expect(() => validator.validate([type], [valid])).not.toThrow()
    expect(() => validator.validate([type], [invalid])).toThrow(Web3ValidatorError)
  })

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

    it('preserves the standard BIP39 seed vector without a mnemonic password', () => {
      const bip39Vector =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      expect(bytesToHex(cache.mnemonicToSeedSync(bip39Vector))).toBe(
        '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19' +
          'a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4'
      )
    })

    it('derives the expected application-path key from the standard BIP39 vector', () => {
      const bip39Vector =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      expect(getAccountFromPassphrase(bip39Vector, api)).toMatchObject({
        address: '0x55a1354836b9D44F668ED5B3c66aA7Fd6a002b99',
        privateKey: '0xeb39edc33d0a45d141154fe985a760b03ac4054239d958fa02d3c198a393574b'
      })
    })
  })

  describe('calculateFee', () => {
    it('should calculate basic ETH transfer fee', () => {
      const gasUsed = 21000
      const gasPrice = 20000000000
      expect(calculateFee(gasUsed, gasPrice)).toBe('0.00042')
    })

    it('should calculate ERC20 transfer fee', () => {
      const gasUsed = 60000
      const gasPrice = 25000000000
      expect(calculateFee(gasUsed, gasPrice)).toBe('0.0015')
    })

    it('should handle string inputs from API', () => {
      const gasUsed = '35000'
      const gasPrice = '15000000000'
      expect(calculateFee(gasUsed, gasPrice)).toBe('0.000525')
    })

    it('should return "0" when gasPrice is missing (London hardfork case)', () => {
      const gasUsed = 21000
      expect(calculateFee(gasUsed, null)).toBe('0')
      expect(calculateFee(gasUsed, undefined)).toBe('0')
    })
  })
})
