import VuexPersistence from 'vuex-persist'

export function reduceSessionState(state) {
  return {
    // Deliberately exclude the passphrase and password hash. A refresh must require the user
    // to unlock the encrypted cache again instead of leaving account secrets in Web Storage.
    address: state.address,
    balance: state.balance
  }
}

export function restoreSessionState(key, storage = window.sessionStorage) {
  const serialized = storage.getItem(key)

  // Remove the legacy value before parsing it so old passphrases and password hashes are not
  // left behind if parsing or rewriting fails.
  storage.removeItem(key)

  let restored = {}

  if (serialized) {
    try {
      const state = JSON.parse(serialized)

      if (state && typeof state === 'object') {
        if (typeof state.address === 'string') restored.address = state.address
        if (typeof state.balance === 'number' && Number.isFinite(state.balance)) {
          restored.balance = state.balance
        }
      }
    } catch {
      // Ignore malformed session state and start with the store defaults.
    }
  }

  storage.setItem(key, JSON.stringify(restored))

  return restored
}

const vuexPersistence = new VuexPersistence({
  key: 'adm',
  storage: window.sessionStorage,
  reducer: reduceSessionState,
  restoreState: restoreSessionState
})

export default vuexPersistence.plugin
