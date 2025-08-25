import dbPromise from '@/lib/idb/db'
import { encrypt, decrypt } from '../crypto'

const storeName = 'common'

export default {
  async getAll() {
    try {
      const db = await dbPromise
      const rows = await db.transaction(storeName).objectStore(storeName).getAll()

      return rows.map(({ name, value }) => {
        return {
          name,
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
        name,
        value: encrypt(value)
      })

      return tx.complete
    } catch (err) {
      return Promise.reject(err)
    }
  },

  async saveAll(modules) {
    try {
      const db = await dbPromise
      const tx = db.transaction(storeName, 'readwrite')

      modules.forEach(({ name, value }) => {
        tx.objectStore(storeName).put({
          name: name,
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
