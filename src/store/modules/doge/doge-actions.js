import baseActions from '../btc-base/btc-base-actions'
import DogeApi from '../../../lib/bitcoin/doge-api'

const getOldTransactions = (api, context) => {
  const from = Object.keys(context.state.transactions).length
  return api.getTransactions({ from }).then(result => {
    context.commit('transactions', result.items)
    if (!result.hasMore) {
      context.commit('bottom')
    }
  })
}

const getNewTransactions = (api, context) => {
  return api.getTransactions({ }).then(result => {
    context.commit('transactions', result.items)
  })
}

export default {
  ...baseActions({
    apiCtor: DogeApi,
    getOldTransactions,
    getNewTransactions
  })
}

// import DogeApi, { TX_FEE } from '../../../lib/doge-api'
// import * as admApi from '../../../lib/adamant-api'
// import { Cryptos } from '../../../lib/constants'

// const MAX_ATTEMPTS = 60

// /** @type {DogeApi} */
// let api = null

// export default {
//   afterLogin: {
//     root: true,
//     handler (context, passphrase) {
//       api = new DogeApi(passphrase)
//       context.commit('address', api.address)
//       context.dispatch('updateStatus')
//       context.dispatch('storeAddress')
//     }
//   },

//   /** Resets module state */
//   reset: {
//     root: true,
//     handler (context) {
//       api = null
//       context.commit('reset')
//     }
//   },

//   /** Handles store rehydratation: generates an account if one is not ready yet */
//   rehydrate: {
//     root: true,
//     handler (context) {
//       const passphrase = context.rootGetters.getPassPhrase
//       if (passphrase) {
//         api = new DogeApi(passphrase)
//         context.commit('address', api.address)
//         context.dispatch('updateStatus')
//         context.dispatch('storeAddress')
//       }
//     }
//   },

//   updateBalance: {
//     root: true,
//     handler (context) {
//       context.dispatch('updateStatus')
//     }
//   },

//   storeAddress ({ state, dispatch }) {
//     const payload = { address: state.address, crypto: Cryptos.DOGE }
//     return dispatch('storeCryptoAddress', payload, { root: true })
//   },

//   updateStatus (context) {
//     if (!api) return
//     api.getBalance().then(balance => context.commit('status', { balance }))
//   },

//   sendTokens (context, { amount, admAddress, address, comments }) {
//     if (!api) return
//     address = address.trim()

//     return api.createTransaction(address, amount)
//       .then(tx => {
//         if (!admAddress) return tx.hex

//         // Send a special message to indicate that we're performing an ETH transfer
//         const type = 'doge_transaction'
//         const msg = { type, amount, hash: tx.txid, comments }
//         return admApi.sendSpecialMessage(admAddress, msg)
//           .then(response => {
//             if (response.success) {
//               console.log('ADM message has been sent', msg)
//               return tx.hex
//             } else {
//               console.log(`Failed to send "${type}"`, response)
//               return Promise.reject(new Error('adm_message'))
//             }
//           })
//       })
//       .then(rawTx => api.sendTransaction(rawTx).then(
//         hash => ({ hash }),
//         error => ({ error })
//       ))
//       .then(({ hash, error }) => {
//         if (error) {
//           console.error(`Failed to send DOGE transaction`, error)
//           context.commit('transactions', [{ hash, status: 'ERROR' }])
//           throw error
//         } else {
//           console.log(`${crypto} transaction has been sent`)

//           context.commit('transactions', [{
//             hash,
//             senderId: context.state.address,
//             recipientId: address,
//             amount,
//             fee: TX_FEE,
//             status: 'PENDING',
//             timestamp: Date.now()
//           }])

//           context.dispatch('getTransaction', { hash, isNew: true })

//           return hash
//         }
//       })
//   },

//   /**
//    * Retrieves transaction details
//    * @param {object} context Vuex action context
//    * @param {{hash: string, force: boolean, timestamp: number, amount: number}} payload hash and timestamp of the transaction to fetch
//    */
//   getTransaction (context, payload) {
//     if (!api) return

//     const existing = context.state.transactions[payload.hash]
//     if (existing && existing.status !== 'PENDING' && !payload.force) return

//     // Set a stub so far
//     if (!existing || existing.status === 'ERROR') {
//       context.commit('transactions', [{
//         hash: payload.hash,
//         timestamp: payload.timestamp,
//         amount: payload.amount,
//         status: 'PENDING'
//       }])
//     }

//     api.getTransaction(payload.hash)
//       .then(
//         tx => {
//           if (tx) context.commit('transactions', [tx])
//           return (!tx && payload.isNew) || (tx && tx.status !== 'SUCCESS')
//         },
//         () => true
//       )
//       .then(replay => {
//         const attempt = payload.attempt || 0
//         if (replay && attempt < MAX_ATTEMPTS) {
//           const newPayload = { ...payload, attempt: attempt + 1 }
//           setTimeout(() => context.dispatch('getTransaction', newPayload), 3000)
//         }
//       })
//   },

//   getNewTransactions (context) {
//     if (!api) return

//     return api.getTransactions().then(result => {
//       context.commit('transactions', result.items)
//     })
//   },

//   getOldTransactions (context) {
//     if (!api) return

//     const from = Object.keys(context.state.transactions).length
//     return api.getTransactions(from).then(result => {
//       context.commit('transactions', result.items)
//       if (!result.hasMore) {
//         context.commit('bottom')
//       }
//     })
//   }
// }
