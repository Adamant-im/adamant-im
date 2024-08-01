import { CryptosInfo } from '@/lib/constants'

export const KlayrHashSettings = {
  SALT: 'adm',
  ITERATIONS: 2048,
  KEYLEN: 32,
  DIGEST: 'sha256'
} as const

export const KLY_CHAIN_ID = '00000000'
export const KLY_TOKEN_ID = '0000000000000000'
export const KLY_DECIMALS = CryptosInfo.KLY.decimals
export const KLY_MIN_FEE_PER_BYTE = BigInt(1000) // in beddows
export const KLY_TRANSFER_TO_NEW_ACCOUNT_FEE = BigInt(5000000) // additional fee when sending to new accounts (@see https://klayr.xyz/documentation/understand-blockchain/blocks-txs.html#command-fee)
export const KLY_TXS_PER_PAGE = 25 // transactions per page

// Used for estimating fee
// Generated from passphrase: joy mouse injury soft decade bid rough about alarm wreck season sting
export const KLY_DEMO_ACCOUNT = {
  address: 'klykjurzk3xb47scma49ukyqupn8vrg2ggyuehk5j',
  keyPair: {
    publicKey: '32eb8aff28d635ba03b2bb6cc785072c0c01123a24f56e580ff9c7320611f11d',
    secretKey:
      'fca383b538589f972742cb87033ef7894fff7a7b6d52c74bddf7e4f7f8660a0d32eb8aff28d635ba03b2bb6cc785072c0c01123a24f56e580ff9c7320611f11d'
  }
}
