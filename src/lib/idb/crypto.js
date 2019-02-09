import ed2curve from 'ed2curve'
import nacl from 'tweetnacl/nacl-fast'
import crypto from 'pbkdf2'
import { decode } from '@stablelib/utf8'

import { bytesToHex } from '@/lib/hex'
import { UserPasswordHashSettings } from '@/lib/constants'
import store from '@/store'

const NONCE = Buffer.allocUnsafe(24)

/**
 * @param {string|number|Object} data
 * @returns {Buffer}
 */
export function encrypt (data) {
  const stringified = JSON.stringify(data)
  const secretKey = ed2curve.convertSecretKey(store.state.password)

  return nacl.secretbox(Buffer.from(stringified), NONCE, secretKey)
}

/**
 * @param {Buffer} encryptedData
 * @returns {string|number|Object}
 */
export function decrypt (encryptedData) {
  const secretKey = ed2curve.convertSecretKey(store.state.password)
  const decoded = decode(nacl.secretbox.open(encryptedData, NONCE, secretKey))

  return JSON.parse(decoded)
}

export function encryptPassword (password) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      UserPasswordHashSettings.SALT,
      UserPasswordHashSettings.ITERATIONS,
      UserPasswordHashSettings.KEYLEN,
      UserPasswordHashSettings.DIGEST,
      (err, encryptedPassword) => {
        if (err) return reject(err)

        const passwordString = bytesToHex(encryptedPassword)

        resolve(passwordString)
      }
    )
  })
}
