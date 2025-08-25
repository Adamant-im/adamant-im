import dbPromise from '@/lib/idb/db'
import { encrypt, decrypt } from '../crypto'
import { bytesToHex, hexToBytes } from '@/lib/hex'

const storeName = 'chatList'

export default {
  async getAll() {
    try {
      const db = await dbPromise
      const chats = await db.transaction(storeName).objectStore(storeName).getAll()

      return chats.map(({ name, value }) => {
        return {
          name: decrypt(hexToBytes(name)),
          value: decrypt(value)
        }
      })
    } catch {
      throw new Error('Invalid password')
    }
  },

  async set({ name, value }) {
    try {
      const db = await dbPromise
      const tx = db.transaction(storeName, 'readwrite')

      tx.objectStore(storeName).put({
        name: bytesToHex(encrypt(name)),
        value: encrypt(value)
      })

      return tx.complete
    } catch (err) {
      return Promise.reject(err)
    }
  },

  async saveAll(chats) {
    try {
      const db = await dbPromise
      const tx = db.transaction(storeName, 'readwrite')

      tx.objectStore(storeName).clear() // clear old chats

      chats.forEach(({ name, value }) => {
        tx.objectStore(storeName).put({
          name: bytesToHex(encrypt(name)),
          value: encrypt(value)
        })
      })

      return tx.complete
    } catch (err) {
      return Promise.reject(err)
    }
  },

  async clear() {
    const db = await dbPromise
    const tx = db.transaction(storeName, 'readwrite')

    tx.objectStore(storeName).clear()

    return tx.complete
  }
}
