import db from './db'
import { encrypt, decrypt } from './crypto'
import Security from './stores/Security'
import Modules from './stores/Modules'
import Chats from './stores/Chats'
import { logger } from '@/utils/devTools/logger'

async function clearDb() {
  try {
    const openedDb = await db
    const storeNames = ['common', 'chatList', 'security']
    const transaction = openedDb.transaction(storeNames, 'readwrite')

    for (const storeName of storeNames) {
      transaction.objectStore(storeName).clear()
    }

    await transaction.done
  } catch (err) {
    logger.log('idb', 'warn', 'Error while trying to clear IDB', err)
    throw err
  }
}

export { db, clearDb, encrypt, decrypt, Security, Modules, Chats }
