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

function getItem<K extends string, S = unknown>(key: K, defaultValue: S): S {
  const rawData = window.localStorage.getItem(key)
  if (rawData === null) {
    return defaultValue
  }

  try {
    return JSON.parse(rawData) ?? defaultValue
  } catch (err) {
    window.localStorage.removeItem(key)

    return defaultValue
  }
}

function getState(): State {
  return getItem(NODES_STATE_STORAGE_KEY, {})
}

function saveState(newState: State) {
  const rawData = JSON.stringify(newState)

  window.localStorage.setItem(NODES_STATE_STORAGE_KEY, rawData)
}

const defaultOptions: Options = {
  adm: { useFastest: false },
  btc: { useFastest: false },
  doge: { useFastest: false },
  dash: { useFastest: false },
  eth: { useFastest: false },
  lsk: { useFastest: false }
}

function getOptions() {
  return getItem(NODES_OPTIONS_STORAGE_KEY, defaultOptions)
}

function saveOptions(newOptions: Options) {
  const rawData = JSON.stringify(newOptions)

  window.localStorage.setItem(NODES_OPTIONS_STORAGE_KEY, rawData)
}

export const nodesStorage = {
  isActive(url: string): boolean {
    const state = getState()

    return state[url] ?? true
  },
  saveActive(url: string, enabled: boolean) {
    const state = getState()
    state[url] = enabled

    saveState(state)
  },
  getUseFastest(node: NodeType) {
    const options = getOptions()

    return options[node].useFastest
  },
  setUseFastest(value: boolean, node: NodeType) {
    const options = getOptions()
    options[node].useFastest = value

    saveOptions(options)
  }
}
