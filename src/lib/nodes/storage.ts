type URL = string
type Enabled = boolean
type State = Record<URL, Enabled>

const NODES_STORAGE_KEY = 'NODES_STORAGE'

function getState(): State {
  const rawData = window.localStorage.getItem(NODES_STORAGE_KEY)
  if (rawData === null) {
    return {}
  }

  try {
    const jsonData = JSON.parse(rawData)

    return jsonData || {}
  } catch (err) {
    window.localStorage.removeItem(NODES_STORAGE_KEY)

    return {}
  }
}

function saveState(newState: State) {
  const rawData = JSON.stringify(newState)

  window.localStorage.setItem(NODES_STORAGE_KEY, rawData)
}

/**
 * Storage for storing nodes active/inactive state.
 */
export const nodesStorage = {
  isActive(url: string): boolean {
    try {
      const state = getState()

      return state[url] ?? true
    } catch (err) {
      return false
    }
  },
  saveActive(url: string, enabled: boolean) {
    const state = getState()
    state[url] = enabled

    saveState(state)
  }
}
