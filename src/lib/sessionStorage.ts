export function getFromSessionStorage<K extends string, S = unknown>(key: K, defaultValue: S): S {
  const rawData = window.sessionStorage.getItem(key)
  if (rawData === null) {
    return defaultValue
  }

  try {
    return JSON.parse(rawData) ?? defaultValue
  } catch (err) {
    window.sessionStorage.removeItem(key)

    return defaultValue
  }
}
export function removeFromSessionStorage<K extends string>(key: K, subkey?: K): void {
  if (subkey) {
    const sessionStorageItem: unknown = getFromSessionStorage(key, {})
    if (!!sessionStorageItem && typeof sessionStorageItem === 'object') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      delete sessionStorageItem[subkey]
    }
    setToSessionStorage(key, sessionStorageItem)
  }
}

export function setToSessionStorage<K extends string, S = unknown>(key: K, value: S): void {
  sessionStorage.setItem(key, JSON.stringify(value))
}
