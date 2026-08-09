import ed2curve from 'ed2curve'
import nacl from 'tweetnacl/nacl-fast'
import pbkdf2 from 'pbkdf2'
import { decode } from '@stablelib/utf8'

import { bytesToHex } from '@/lib/hex'
import { UserPasswordHashSettings } from '@/lib/constants'
import store from '@/store'
import { Buffer } from 'buffer'

const NONCE_LENGTH = 24

function getPasswordHash(password) {
  if (password && typeof password === 'object' && password.hash) {
    return password.hash
  }

  return password
}

function getSecretKey() {
  return ed2curve.convertSecretKey(getPasswordHash(store.state.password))
}

/**
 * Stored layout is `nonce || ciphertext`.
 *
 * There is deliberately no support for the previous layout, which shared one nonce across
 * every record. Records written before this change simply fail to decrypt, the database is
 * cleared, and the user signs in with the passphrase once — only cached blockchain data is
 * lost. A compatibility path would be more code than the data is worth at this point.
 * @param {string|number|Object} data
 * @returns {Buffer}
 */
export function encrypt(data) {
  const stringified = JSON.stringify(data)
  const secretKey = getSecretKey()

  // A fresh nonce per record. One shared nonce means every record is encrypted with the same
  // keystream, so XOR of any two of them cancels the keystream out, and the known JSON
  // structure of the plaintext is enough to recover both. It also voids Poly1305
  // authentication, which makes stored records forgeable.
  const nonce = nacl.randomBytes(NONCE_LENGTH)
  const box = nacl.secretbox(Buffer.from(stringified), nonce, secretKey)

  return Buffer.concat([Buffer.from(nonce), Buffer.from(box)])
}

/**
 * @param {Buffer|Uint8Array} encryptedData
 * @returns {string|number|Object}
 */
export function decrypt(encryptedData) {
  const secretKey = getSecretKey()
  const bytes = encryptedData instanceof Uint8Array ? encryptedData : new Uint8Array(encryptedData)

  const nonce = bytes.subarray(0, NONCE_LENGTH)
  const box = bytes.subarray(NONCE_LENGTH)
  const decrypted = bytes.length > NONCE_LENGTH ? nacl.secretbox.open(box, nonce, secretKey) : null

  if (decrypted === null) {
    throw new Error('Failed to decrypt IDB record: wrong password, old format, or corrupted data')
  }

  return JSON.parse(decode(decrypted))
}

export function encryptPassword(password) {
  return new Promise((resolve, reject) => {
    pbkdf2.pbkdf2(
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
