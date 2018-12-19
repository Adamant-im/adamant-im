import idb from 'idb'
import ed2curve from 'ed2curve'
import nacl from 'tweetnacl/nacl-fast'
import { decode } from '@stablelib/utf8'

const DATABASE_NAME = 'adm'
const DEFAULT_KEY_PATH = 'name'
const READWRITE = 'readwrite'
const READONLY = 'readonly'
const TO_STRING_TRANSFORM_TYPE = 'hex'
const NONCE = Buffer.allocUnsafe(24)

const SECURITY = 'security'
const PASSPHRASE = 'passPhrase'
const USER_PASSWORD = 'userPassword'
const COMMON = 'common'
const CONTACT_LIST = 'contactList'
const CHAT_LIST = 'chatList'

export function getAdmDataBase () {
  return idb.open(DATABASE_NAME, 1, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains(SECURITY)) {
      upgradeDb.createObjectStore(SECURITY, { keyPath: DEFAULT_KEY_PATH, autoIncrement: true })
    }
    if (!upgradeDb.objectStoreNames.contains(COMMON)) {
      upgradeDb.createObjectStore(COMMON, { keyPath: DEFAULT_KEY_PATH, autoIncrement: true })
    }
    if (!upgradeDb.objectStoreNames.contains(CONTACT_LIST)) {
      upgradeDb.createObjectStore(CONTACT_LIST, { keyPath: DEFAULT_KEY_PATH, autoIncrement: true })
    }
    if (!upgradeDb.objectStoreNames.contains(CHAT_LIST)) {
      upgradeDb.createObjectStore(CHAT_LIST, { keyPath: DEFAULT_KEY_PATH, autoIncrement: true })
    }
  })
}

export function updateUserPassword (value) {
  sessionStorage.setItem('userPassword', value.toString(TO_STRING_TRANSFORM_TYPE))
}

export function updatePassPhrase (db, value) {
  const passPhrase = {
    name: PASSPHRASE,
    value: value
  }
  return saveValueByName(db, SECURITY, passPhrase)
}

export function updateCommonItem (db, value) {
  const commonItem = {
    name: COMMON,
    value: value
  }
  return saveValueByName(db, COMMON, commonItem)
}

export function updateContactItem (db, value) {
  const contactItem = {
    name: CONTACT_LIST,
    value: value
  }
  return saveValueByName(db, CONTACT_LIST, contactItem)
}

export function updateChatItem (db, key, value) {
  const chatItem = {
    name: key,
    value: value
  }
  return saveValueByName(db, CHAT_LIST, chatItem)
}

export function getContactItem (db) {
  return getValueByName(db, CONTACT_LIST, CONTACT_LIST)
}

export function getChatItem (db) {
  const transaction = db.transaction(CHAT_LIST, READONLY)
  const store = transaction.objectStore(CHAT_LIST)
  return store.getAll()
}

export function getCommonItem (db) {
  return getValueByName(db, COMMON, COMMON)
}

export function getPassPhrase (db) {
  return getValueByName(db, SECURITY, PASSPHRASE)
}

export function getUserPassword () {
  return sessionStorage.getItem('userPassword')
}

export function clearDb (db) {
  clearContactList(db)
  clearChatList(db)
  clearSecurity(db)
  clearCommon(db)
}

export function clearSecurity (db) {
  const transaction = db.transaction(SECURITY, READWRITE)
  const store = transaction.objectStore(SECURITY)
  store.delete(PASSPHRASE)
  store.delete(USER_PASSWORD)
  return transaction.complete
}

export function clearCommon (db) {
  const transaction = db.transaction(COMMON, READWRITE)
  const store = transaction.objectStore(COMMON)
  store.delete(COMMON)
  return transaction.complete
}

export function clearChatList (db) {
  const transaction = db.transaction(CHAT_LIST, READWRITE)
  const store = transaction.objectStore(CHAT_LIST)
  store.clear()
  return transaction.complete
}

export function clearContactList (db) {
  const transaction = db.transaction(CONTACT_LIST, READWRITE)
  const store = transaction.objectStore(CONTACT_LIST)
  store.delete(CONTACT_LIST)
  return transaction.complete
}

export function encryptData (data) {
  let userPassword = sessionStorage.getItem('userPassword')
  const secretKey = ed2curve.convertSecretKey(userPassword.toString(TO_STRING_TRANSFORM_TYPE))
  return nacl.secretbox(Buffer.from(data), NONCE, secretKey)
}

export function decryptData (encryptedData) {
  let userPassword = sessionStorage.getItem('userPassword')
  const secretKey = ed2curve.convertSecretKey(userPassword.toString(TO_STRING_TRANSFORM_TYPE))
  return decode(nacl.secretbox.open(encryptedData, NONCE, secretKey))
}

function saveValueByName (db, storeObject, value) {
  const transaction = db.transaction(storeObject, READWRITE)
  const store = transaction.objectStore(storeObject)
  store.put(value)
  return transaction.complete
}

function getValueByName (db, storeObject, name) {
  const transaction = db.transaction(storeObject, READONLY)
  const store = transaction.objectStore(storeObject)
  return store.get(name)
}
