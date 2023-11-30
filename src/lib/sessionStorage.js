export const getFromSessionStorage = (key) => {
  return JSON.parse(sessionStorage.getItem(key))
}
export const removeFromSessionStorage = (key, coin) => {
  const sessionStorageItem = getFromSessionStorage(key)
  delete sessionStorageItem[coin]
  setToSessionStorage(key, sessionStorageItem)
}

export const setToSessionStorage = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value))
}
