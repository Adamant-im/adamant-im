export function getFromLocalStorage<K extends string, S = unknown>(key: K, defaultValue: S): S {
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
export function removeFromLocalStorage<K extends string>(key: K, subkey?: K): void {
  if (subkey) {
    const localStorageItem: unknown = getFromLocalStorage(key, {})
    if (!!localStorageItem && typeof localStorageItem === 'object') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      delete localStorageItem[subkey]
    }
    setToLocalStorage(key, localStorageItem)
  }
}

export function setToLocalStorage<K extends string, S = unknown>(key: K, value: S): void {
  window.localStorage.setItem(key, JSON.stringify(value))
}
