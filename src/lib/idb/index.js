import db from './db'
import { encrypt, decrypt } from './crypto'
import Security from './stores/Security'
import Modules from './stores/Modules'
import Chats from './stores/Chats'
import { logger } from '@/utils/devTools/logger'

function clearDb() {
  return Promise.all([Modules.clear(), Chats.clear(), Security.clear()]).catch((err) => {
    logger.log('idb', 'warn', 'Error while trying to clear IDB', err)
  })
}

export { db, clearDb, encrypt, decrypt, Security, Modules, Chats }
