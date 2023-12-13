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

export function setToSessionStorage<K extends string, S = unknown>(key: K, value: S): void {
  window.sessionStorage.setItem(key, JSON.stringify(value))
}
