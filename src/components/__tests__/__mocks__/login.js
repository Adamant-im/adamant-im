export default function login (context, passphrase) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (passphrase === 'correct passphrase') {
        return resolve(true)
      }

      reject(new Error('Incorrect passphrase'))
    }, 1000)
  })
}
