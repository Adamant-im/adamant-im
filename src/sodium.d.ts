declare module 'sodium-browserify-tweetnacl' {
  type KeyPair = {
    publicKey: Buffer
    secretKey: Buffer
  }
  declare function crypto_sign_seed_keypair(seed: Buffer): KeyPair
}
