import { openDB } from 'idb'

const DB_NAME = 'adm'
const DB_VERSION = 1

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('security')) {
      db.createObjectStore('security', { keyPath: 'name', autoIncrement: true })
    }
    if (!db.objectStoreNames.contains('common')) {
      db.createObjectStore('common', { keyPath: 'name', autoIncrement: true })
    }
    if (!db.objectStoreNames.contains('chatList')) {
      db.createObjectStore('chatList', { keyPath: 'name', autoIncrement: true })
    }
  }
})

export default dbPromise
