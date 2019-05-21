import db from './db'
import { encrypt, decrypt } from './crypto'
import Security from './stores/Security'
import Modules from './stores/Modules'
import Chats from './stores/Chats'

function clearDb () {
  return Promise.all([
    Modules.clear(),
    Chats.clear(),
    Security.clear()
  ]).catch(err => {
    console.error('Error while trying to clear IDB', err)
  })
}

export {
  db,
  clearDb,
  encrypt,
  decrypt,
  Security,
  Modules,
  Chats
}
