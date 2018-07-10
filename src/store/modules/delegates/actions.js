import Mnemonic from 'bitcore-mnemonic'
import hdkey from 'hdkey'
import Web3 from 'web3'

import getEndpointUrl from '../../../lib/getEndpointUrl'
import * as admApi from '../../../lib/adamant-api'

import constants from '../../../lib/constants'

function getDelegates (context, limit = constants.Delegates.ACTIVE_DELEGATES, offset = 0, votes = []) {
  context.$store.commit('ajax_start')
  context.$http.get(context.getAddressString() + `/api/delegates?limit=${limit}&offset=${offset}`).then(response => {
    if (response.body.success) {
      for (let i in response.body.delegates) {
        const delegate = response.body.delegates[i]
        const voted = votes.includes(delegate.address)
        delegate._voted = voted
        delegate.voted = voted
        delegate.upvoted = false
        delegate.downvoted = false
        delegate.showDetails = false
        delegate.forged = 0
        delegate.status = 5
        context.$store.commit('delegate_info', delegate)
      }
      context.$store.commit('ajax_end')
    } else {
      context.$store.commit('ajax_end_with_error')
    }
  }, () => {
    context.$store.commit('ajax_end_with_error')
  })
}
  // Vue.prototype.checkUnconfirmedTransactions = function () {
  //   this.$store.commit('ajax_start')
  //   this.$http.get(this.getAddressString() + '/api/transactions/unconfirmed').then(response => {
  //     if (response.body.success) {
  //       if (response.body.count === 0) {
  //         this.$store.commit('set_last_transaction_status', true)
  //         // this.$store.commit('ajax_end')
  //       } else {
  //         this.checkUnconfirmedTransactions()
  //       }
  //     } else {
  //       this.$store.commit('ajax_end_with_error')
  //     }
  //   }, () => {
  //     this.$store.commit('ajax_end_with_error')
  //   })
  // }
  // Vue.prototype.voteForDelegates = function (votes) {
  //   let keys = this.getKeypair()
  //   let transaction = adamantAPI.newTransaction(constants.Transactions.VOTE)
  //   transaction = Object.assign({
  //     asset: {votes: votes},
  //     recipientId: this.$store.state.address,
  //     amount: 0
  //   }, transaction)
  //   transaction.signature = adamant.transactionSign(transaction, keys)
  //   this.$store.commit('clean_delegates')
  //   this.$store.commit('ajax_start')
  //   this.$http.post(this.getAddressString() + '/api/accounts/delegates', transaction).then(response => {
  //     if (response.body.success) {
  //       this.$store.commit('set_last_transaction_status', false)
  //       // removing an UI waiting state if transaction confirmation run to much time
  //       window.setTimeout(() => {
  //         if (!this.$store.state.lastTransactionConfirmed) {
  //           this.$store.commit('send_error', { msg: this.$t('votes.transaction_confirm_await') })
  //         }
  //         this.$store.commit('ajax_end')
  //         this.getDelegatesWithVotes()
  //       }, 15000)
  //       this.checkUnconfirmedTransactions()
  //     } else {
  //       this.$store.commit('send_error', { msg: `${this.$t('error')}: ${response.body.error}` })
  //       this.getDelegatesWithVotes()
  //     }
  //   }, () => {
  //     this.$store.commit('ajax_end_with_error')
  //   })
  // }

  // Vue.prototype.getForgingTimeForDelegate = function (delegate) {
  //   const getRoundDelegates = (delegates, height) => {
  //     let currentRound = round(height)
  //     return delegates.filter((delegate, index) => {
  //       return currentRound === round(height + index + 1)
  //     })
  //   }
  //   const round = height => {
  //     if (isNaN(height)) {
  //       return 0
  //     } else {
  //       return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0)
  //     }
  //   }

  //   this.$store.commit('ajax_start')
  //   this.$http.get(this.getAddressString() + '/api/delegates/getNextForgers?limit=101').then(response => {
  //     if (response.body.success) {
  //       const nextForgers = response.body.delegates
  //       const fIndex = nextForgers.indexOf(delegate.publicKey)
  //       const forgingTime = fIndex === -1 ? -1 : fIndex * 10
  //       this.$store.commit('update_delegate', {
  //         address: delegate.address,
  //         params: { forgingTime: forgingTime }
  //       })
  //       this.$http.get(this.getAddressString() + '/api/blocks?orderBy=height:desc&limit=100').then(response => {
  //         if (response.body.success) {
  //           let lastBlock = response.body.blocks[0]
  //           let blocks = response.body.blocks.filter(x => x.generatorPublicKey === delegate.publicKey)
  //           let time = Date.now()
  //           let status = { updatedAt: time }
  //           if (blocks.length > 0) {
  //             status.lastBlock = blocks[0]
  //             status.blockAt = new Date(((constants.EPOCH + status.lastBlock.timestamp) * 1000))
  //             var roundDelegates = getRoundDelegates(nextForgers, lastBlock.height)
  //             var isRoundDelegate = roundDelegates.indexOf(delegate.publicKey) !== -1
  //             status.networkRound = round(lastBlock.height)
  //             status.delegateRound = round(status.lastBlock.height)
  //             status.awaitingSlot = status.networkRound - status.delegateRound
  //           } else {
  //             status.lastBlock = null
  //           }
  //           if (status.awaitingSlot === 0) {
  //             // Forged block in current round
  //             status.code = 0
  //           } else if (!isRoundDelegate && status.awaitingSlot === 1) {
  //             // Missed block in current round
  //             status.code = 1
  //           } else if (!isRoundDelegate && status.awaitingSlot > 1) {
  //             // Missed block in current and last round = not forging
  //             status.code = 2
  //           } else if (status.awaitingSlot === 1) {
  //             // Awaiting slot, but forged in last round
  //             status.code = 3
  //           } else if (status.awaitingSlot === 2) {
  //             // Awaiting slot, but missed block in last round
  //             status.code = 4
  //           } else if (!status.blockAt || !status.updatedAt || status.lastBlock === null) {
  //             // Awaiting status or unprocessed
  //             status.code = 5
  //           // For delegates which not forged a signle block yet (statuses 0,3,5 not apply here)
  //           } else if (!status.blockAt && status.updatedAt) {
  //             if (!isRoundDelegate && delegate.missedblocks === 1) {
  //               // Missed block in current round
  //               status.code = 1
  //             } else if (delegate.missedblocks > 1) {
  //             // Missed more than 1 block = not forging
  //               status.code = 2
  //             } else if (delegate.missedblocks === 1) {
  //             // Missed block in previous round
  //               status.code = 4
  //             }
  //           } else {
  //             // Not Forging
  //             status.code = 2
  //           }
  //           this.$store.commit('update_delegate', {
  //             address: delegate.address,
  //             params: { status: status.code }
  //           })
  //           this.$store.commit('ajax_end')
  //         } else {
  //           this.$store.commit('ajax_end_with_error')
  //         }
  //       }, () => {
  //         this.$store.commit('ajax_end_with_error')
  //       })
  //     } else {
  //       this.$store.commit('ajax_end_with_error')
  //     }
  //   }, () => {
  //     this.$store.commit('ajax_end_with_error')
  //   })
  // }

  // Vue.prototype.getForgedByAccount = function (delegate) {
  //   this.$store.commit('ajax_start')
  //   this.$http.get(this.getAddressString() + '/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + delegate.publicKey).then(response => {
  //     if (response.body.success) {
  //       this.$store.commit('update_delegate', {
  //         address: delegate.address,
  //         params: { forged: response.body.forged }
  //       })
  //       this.$store.commit('ajax_end')
  //     } else {
  //       this.$store.commit('ajax_end_with_error')
  //     }
  //   }, response => {
  //     this.$store.commit('ajax_end_with_error')
  //   })
  // }



// const HD_KEY_PATH = "m/44'/60'/3'/1/0"
// const TRANSFER_GAS = '21000'
// const KVS_ADDRESS = 'eth:address'
// const DEFAULT_GAS_PRICE = '20000000000' // 20 Gwei
// /** Max number of attempts to retrieve the transaction details */
// const MAX_ATTEMPTS = 150

// const endpoint = getEndpointUrl('ETH')
// const api = new Web3(new Web3.providers.HttpProvider(endpoint, 2000))

// /** Background requests queue */
// const backgroundRequests = []
// /** Background requests timer */
// let backgroundTimer = null

// /** Timestamp of the most recent status update */
// let lastStatusUpdate = 0
// /** Status update interval */
// const STATUS_INTERVAL = 8000

// /**
//  * Creates ETH account for the specified passphrase.
//  *
//  * @param {string} passphrase 12-word passphrase
//  * @returns {{address: string, privateKey: string, publicKey: string}} account
//  */
// function getAccountFromPassphrase (passphrase) {
//   const mnemonic = new Mnemonic(passphrase, Mnemonic.Words.ENGLISH)
//   const seed = mnemonic.toSeed()
//   const privateKey = hdkey.fromMasterSeed(seed).derive(HD_KEY_PATH)._privateKey

//   return api.eth.accounts.privateKeyToAccount('0x' + privateKey.toString('hex'))
// }

// function toEther (wei) {
//   return api.utils.fromWei(`${wei}`, 'ether')
// }

// function toWei (ether) {
//   return api.utils.toWei(`${ether}`, 'ether')
// }

// function enqueueRequest (key, requestSupplier) {
//   if (backgroundRequests.some(x => x.key === key)) return

//   let requests = requestSupplier()
//   backgroundRequests.push({ key, requests: Array.isArray(requests) ? requests : [requests] })
// }

// function executeRequests () {
//   const requests = backgroundRequests.splice(0, 20)
//   if (!requests.length) return

//   const batch = new api.eth.BatchRequest()
//   requests.forEach(x => x.requests.forEach(r => batch.add(r)))

//   batch.execute()
// }

// let isAddressBeingStored = null
// /**
//  * Stores ETH address to the Adamant KVS if it's not there yet
//  * @param {*} context
//  */
// function storeEthAddress (context) {
//   if (isAddressBeingStored) return
//   if (!admApi.isReady()) return
//   if (!context.state.address) return
//   if (context.rootState.balance < Fees.KVS) return
//   if (context.state.isPublished) return

//   isAddressBeingStored = true
//   admApi.getStored(KVS_ADDRESS)
//     .then(address => (address)
//       ? true
//       : admApi.storeValue(KVS_ADDRESS, context.state.address).then(response => response.success)
//     )
//     .then(
//       success => {
//         isAddressBeingStored = false
//         if (success) context.commit('isPublished')
//       },
//       () => { isAddressBeingStored = false }
//     )
// }

export default {
  /**
   * Handles `afterLogin` action: generates ETH-account and requests its balance.
   */
  // afterLogin: {
  //   root: true,
  //   handler (context, passphrase) {
  //     const account = getAccountFromPassphrase(passphrase)
  //     context.commit('account', account)
  //     context.dispatch('updateStatus')

  //     // Store ETH address into the KVS if it's not there yet and user has
  //     // enough ADM for this transaction
  //     storeEthAddress(context)

  //     clearInterval(backgroundTimer)
  //     backgroundTimer = setInterval(executeRequests, 2000)
  //   }
  // },

  // /** Resets module state */
  // reset: {
  //   root: true,
  //   handler (context) {
  //     clearInterval(backgroundTimer)
  //     context.commit('reset')
  //   }
  // },

  // * Handles store rehydratation: generates an account if one is not ready yet 
  // rehydrate: {
  //   root: true,
  //   handler (context) {
  //     const passphrase = context.rootGetters.getPassPhrase
  //     const address = context.state.address

  //     if (!address && passphrase) {
  //       const account = getAccountFromPassphrase(passphrase)
  //       context.commit('account', account)
  //       storeEthAddress(context)
  //     }

  //     context.dispatch('updateStatus')

  //     clearInterval(backgroundTimer)
  //     backgroundTimer = setInterval(executeRequests, 2000)
  //   }
  // },

  // /** On account update this handler ensures that ETH address is in the KVS */
  // updateAccount: {
  //   root: true,
  //   handler (context) {
  //     storeEthAddress(context)
  //   }
  // },

  getDelegates (context) {
    context.$store.commit('ajax_start')
    context.$http.get(context.getAddressString() + '/api/accounts/delegates?address=' + context.$store.state.address).then(response => {
      if (response.body.success) {
        const votes = response.body.delegates.map(vote => vote.address)
        context.$http.get(context.getAddressString() + '/api/delegates/count').then(response => {
          if (response.body.success) {
            context.$store.commit('ajax_end')
            for (let i = 0; i < response.body.count % constants.Delegates.ACTIVE_DELEGATES; i++) {
              getDelegates(context, constants.Delegates.ACTIVE_DELEGATES, i * constants.Delegates.ACTIVE_DELEGATES, votes)
            }
          } else {
            context.$store.commit('ajax_end_with_error')
          }
        })
      } else {
        context.$store.commit('ajax_end_with_error')
      }
    }, () => {
      context.$store.commit('ajax_end_with_error')
    })
  }

  /**
   * Requests ETH account status: balance, gas price, etc.
   * @param {*} context Vuex action context
  //  */
  // updateStatus (context) {
  //   if (!context.state.address) return

  //   const supplier = () => {
  //     if (!context.state.address) return []

  //     const block = context.state.blockNumber ? Math.max(0, context.state.blockNumber - 12) : 0

  //     return [
  //       // Balance
  //       api.eth.getBalance.request(context.state.address, block || 'latest', (err, balance) => {
  //         if (!err) context.commit('balance', toEther(balance))
  //       }),
  //       // Current gas price
  //       api.eth.getGasPrice.request((err, price) => {
  //         if (!err) {
  //           context.commit('gasPrice', {
  //             gasPrice: price,
  //             fee: toEther(2 * Number(TRANSFER_GAS) * price)
  //           })
  //         }
  //       }),
  //       // Current block number
  //       api.eth.getBlockNumber.request((err, number) => {
  //         if (!err) context.commit('blockNumber', number)
  //       })
  //     ]
  //   }

  //   const delay = Math.max(0, STATUS_INTERVAL - Date.now() + lastStatusUpdate)
  //   setTimeout(() => {
  //     if (context.state.address) {
  //       enqueueRequest('status', supplier)
  //       lastStatusUpdate = Date.now()
  //       context.dispatch('updateStatus')
  //     }
  //   }, delay)
  // },

  // /**
  //  * Sends tokens to the specified ETH address.
  //  *
  //  * @param {*} context Vuex action context
  //  * @param {string|number} amount amount to send
  //  * @param {string} receiver receiver ETH-address
  //  * @returns {Promise<string>} ETH transaction hash
  //  */
  // sendTokens (context, { amount, admAddress, ethAddress, comments }) {
  //   // A dirty trick: change gas price a little bit in randomly. This way two subsequent
  //   // transactions with the same amount & recipient will have different hashes, thus preventing
  //   // the "Transaction with the same hash has already been imported" error.
  //   const gasPriceDelta = Math.round(100 * Math.random())
  //   const gasPrice = new api.utils.BN(context.state.gasPrice || DEFAULT_GAS_PRICE).add(
  //     new api.utils.BN(gasPriceDelta)).toString()

  //   const ethTx = {
  //     from: context.state.address,
  //     to: ethAddress,
  //     value: toWei(amount),
  //     gas: TRANSFER_GAS,
  //     gasPrice
  //   }

  //   if (!api.utils.isAddress(ethAddress)) {
  //     return Promise.reject(new Error('invalid_address'))
  //   }

  //   return api.eth.getTransactionCount(context.state.address, 'pending')
  //     .then(count => {
  //       if (count) ethTx.nonce = count
  //       return api.eth.accounts.signTransaction(ethTx, context.state.privateKey)
  //     })
  //     .then(signed => {
  //       const tx = signed.rawTransaction
  //       const hash = api.utils.sha3(tx)
  //       console.log('ETH transaction', hash)

  //       return { tx, hash }
  //     })
  //     .then(signedTx => {
  //       if (!admAddress) return signedTx
  //       // Send a special message to indicate that we're performing an ETH transfer
  //       const msg = { type: 'eth_transaction', amount, hash: signedTx.hash, comments }
  //       return admApi.sendSpecialMessage(admAddress, msg)
  //         .then(() => {
  //           console.log('ADM message has been sent', msg)
  //           return signedTx
  //         })
  //         .catch((error) => {
  //           console.log('Failed to send "eth_transaction"', error)
  //           return Promise.reject(new Error('adm_message'))
  //         })
  //     })
  //     .then(({ tx, hash }) => {
  //       // https://github.com/ethereum/web3.js/issues/1255#issuecomment-356492134
  //       const method = api.eth.sendSignedTransaction.method
  //       const payload = method.toPayload([tx])

  //       return new Promise((resolve) => {
  //         method.requestManager.send(payload, (error, result) => {
  //           console.log('sendSignedTransaction', { error, result })
  //           resolve({ hash: result, error })
  //         })
  //       })
  //     })
  //     .then(({ hash, error }) => {
  //       if (error) {
  //         console.error('Failed to send ETH transaction', error)
  //         context.commit('setTransaction', { hash, status: 'ERROR' })
  //         throw error
  //       } else {
  //         console.log('ETH transaction has been sent')

  //         const timestamp = Date.now()

  //         context.commit('setTransaction', {
  //           hash,
  //           senderId: ethTx.from,
  //           recipientId: ethTx.to,
  //           amount,
  //           fee: toEther(Number(ethTx.gas) * ethTx.gasPrice),
  //           status: 'PENDING',
  //           timestamp
  //         })

  //         context.dispatch('getTransaction', { hash, timestamp, isNew: true })

  //         return hash
  //       }
  //     })
  // },

  // /**
  //  * Enqueues a background request to retrieve the transaction details
  //  * @param {object} context Vuex action context
  //  * @param {{hash: string, timestamp: number, amount: number}} payload hash and timestamp of the transaction to fetch
  //  */
  // getTransaction (context, payload) {
  //   const existing = context.state.transactions[payload.hash]
  //   if (existing && existing.status !== 'PENDING') return

  //   // Set a stub so far
  //   context.commit('setTransaction', {
  //     hash: payload.hash,
  //     timestamp: payload.timestamp,
  //     amount: payload.amount,
  //     status: 'PENDING'
  //   })

  //   const key = 'transaction:' + payload.hash
  //   const supplier = () => api.eth.getTransaction.request(payload.hash, (err, tx) => {
  //     if (!err && tx) {
  //       const transaction = {
  //         hash: tx.hash,
  //         senderId: tx.from,
  //         recipientId: tx.to,
  //         amount: toEther(tx.value),
  //         fee: toEther(Number(tx.gas) * tx.gasPrice),
  //         status: tx.blockNumber ? 'SUCCESS' : 'PENDING',
  //         timestamp: payload.timestamp, // TODO: fetch from block?
  //         blockNumber: tx.blockNumber
  //       }

  //       context.commit('setTransaction', transaction)
  //     }

  //     if (!tx && payload.attempt === MAX_ATTEMPTS) {
  //       // Give up, if transaction could not be found after so many attempts
  //       context.commit('setTransaction', { hash: tx.hash, status: 'ERROR' })
  //     } else if (err || (tx && !tx.blockNumber) || (!tx && payload.isNew)) {
  //       // In case of an error or a pending transaction fetch its details once again later
  //       // Increment attempt counter, if no transaction was found so far
  //       const newPayload = tx ? payload : { ...payload, attempt: 1 + (payload.attempt || 0) }
  //       context.dispatch('getTransaction', newPayload)
  //     }
  //   })

  //   enqueueRequest(key, supplier)
  // }
}
