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
export const LSK_TXS_PER_PAGE = 25 // transactions per page
