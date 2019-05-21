import { openDb } from 'idb'

const DB_NAME = 'adm'
const DB_VERSION = 1

const dbPromise = openDb(DB_NAME, DB_VERSION, upgradeDB => {
  if (!upgradeDB.objectStoreNames.contains('security')) {
    upgradeDB.createObjectStore('security', { keyPath: 'name', autoIncrement: true })
  }
  if (!upgradeDB.objectStoreNames.contains('common')) {
    upgradeDB.createObjectStore('common', { keyPath: 'name', autoIncrement: true })
  }
  if (!upgradeDB.objectStoreNames.contains('chatList')) {
    upgradeDB.createObjectStore('chatList', { keyPath: 'name', autoIncrement: true })
  }
})

export default dbPromise
