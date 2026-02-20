import { DraftState } from '@/store/modules/draft-message'
import { WalletsState } from '@/store/modules/wallets/types'

export interface RootState {
  address: string
  balance: number
  balanceStatus: string // FetchStatus
  passphrase: string
  password: string
  IDBReady: boolean
  publicKeys: Record<string, string>

  // Modules. Not types yet.
  eth: any
  bnb: any
  adm: any
  doge: any
  kly: any
  dash: any
  btc: any
  partners: any
  delegates: any
  nodes: any
  snackbar: any
  language: any
  chat: any
  options: any
  identicon: any
  notification: any
  rate: any
  draftMessage: DraftState
  wallets: WalletsState
}
