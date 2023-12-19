import { CryptosInfo } from '@/lib/constants'

export const LiskHashSettings = {
  SALT: 'adm',
  ITERATIONS: 2048,
  KEYLEN: 32,
  DIGEST: 'sha256'
} as const

export const LSK_CHAIN_ID = '00000000'
export const LSK_TOKEN_ID = '0000000000000000'
export const LSK_DECIMALS = CryptosInfo.LSK.decimals
export const LSK_MIN_REQUIRED_FEE = BigInt(164000) // in beddows
export const LSK_COMMAND_FEE = BigInt(5000000) // additional fee when sending to new accounts (@see https://lisk.com/documentation/understand-blockchain/blocks-txs.html#command-fee)
export const LSK_TXS_PER_PAGE = 25 // transactions per page

// Used for estimating fee
// Generated from passphrase: joy mouse injury soft decade bid rough about alarm wreck season sting
export const LSK_DEMO_ACCOUNT = {
  address: 'lskkjurzk3xb47scma49ukyqupn8vrg2ggyuehk5j',
  keyPair: {
    publicKey: '32eb8aff28d635ba03b2bb6cc785072c0c01123a24f56e580ff9c7320611f11d',
    secretKey:
      'fca383b538589f972742cb87033ef7894fff7a7b6d52c74bddf7e4f7f8660a0d32eb8aff28d635ba03b2bb6cc785072c0c01123a24f56e580ff9c7320611f11d'
  }
}
