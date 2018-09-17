import idb from 'idb'

const DATABASE_NAME = 'adm'
const SECURITY = 'security'
const PASSPHRASE = 'passPhrase'
const READWRITE = 'readwrite'
const READONLY = 'readonly'

export function getAdmDataBase () {
  return idb.open(DATABASE_NAME, 1, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains(SECURITY)) {
      upgradeDb.createObjectStore(SECURITY, {keyPath: 'name', autoIncrement: true})
    }
  })
}

export function updateSecurity (db, security) {
  const transaction = db.transaction(SECURITY, READWRITE)
  const store = transaction.objectStore(SECURITY)
  const passPhrase = {
    name: PASSPHRASE,
    value: security.passPhrase
  }
  store.put(passPhrase)
  return transaction.complete
}

export function getPassPhrase (db) {
  return getValueByName(db, SECURITY, PASSPHRASE)
}

function getValueByName (db, storeObject, name) {
  const transaction = db.transaction(storeObject, READONLY)
  const store = transaction.objectStore(storeObject)
  return store.get(name)
}
