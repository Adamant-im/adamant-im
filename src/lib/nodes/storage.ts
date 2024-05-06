import { TypedStorage } from '@/lib/typed-storage'
import type { NodeType } from './types'

type URL = string
type Enabled = boolean
type State = Record<URL, Enabled>

type Options = Record<
  NodeType,
  {
    useFastest: boolean
  }
>

const NODES_STATE_STORAGE_KEY = 'NODES_STATE_STORAGE' // for storing active/inactive state
const NODES_OPTIONS_STORAGE_KEY = 'NODES_OPTIONS_STORAGE' // for storing common options

const stateStorage = new TypedStorage(NODES_STATE_STORAGE_KEY, {} as State, window.localStorage)

const defaultOptions: Options = {
  adm: { useFastest: false },
  btc: { useFastest: true },
  doge: { useFastest: true },
  dash: { useFastest: true },
  eth: { useFastest: true },
  ipfs: { useFastest: true },
  lsk: { useFastest: true }
}

const optionsStorage = new TypedStorage(
  NODES_OPTIONS_STORAGE_KEY,
  defaultOptions,
  window.localStorage
)

export const nodesStorage = {
  isActive(url: string): boolean {
    const state = stateStorage.getItem()

    return state[url] ?? true
  },
  saveActive(url: string, enabled: boolean) {
    const state = stateStorage.getItem()
    state[url] = enabled

    stateStorage.setItem(state)
  },
  getUseFastest(node: NodeType) {
    const options = optionsStorage.getItem()

    return options[node].useFastest
  },
  setUseFastest(value: boolean, node: NodeType) {
    const options = optionsStorage.getItem()
    options[node].useFastest = value

    optionsStorage.setItem(options)
  }
}
