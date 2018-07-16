import * as constants from '../../../lib/constants'
import * as admApi from '../../../lib/adamant-api'

function _getDelegates (context, limit = constants.Delegates.ACTIVE_DELEGATES, offset = 0, votes = []) {
  admApi.getDelegates(limit, offset).then(response => {
    if (response.success) {
      for (let i in response.delegates) {
        const delegate = response.delegates[i]
        const voted = votes.includes(delegate.address)
        delegate._voted = voted
        delegate.voted = voted
        delegate.upvoted = false
        delegate.downvoted = false
        delegate.showDetails = false
        delegate.forged = 0
        delegate.status = 5
        context.commit('delegate_info', delegate)
      }
    }
  })
}

function checkUnconfirmedTransactions (context) {
  admApi.checkUnconfirmedTransactions().then(response => {
    if (response.success) {
      if (response.count === 0) {
        context.commit('set_last_transaction_status', true)
      } else {
        checkUnconfirmedTransactions(context)
      }
    }
  })
}

function getRoundDelegates (delegates, height) {
  let currentRound = round(height)
  return delegates.filter((delegate, index) => {
    return currentRound === round(height + index + 1)
  })
}

function round (height) {
  if (isNaN(height)) {
    return 0
  } else {
    return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0)
  }
}

export default {
  getDelegates (context, payload) {
    admApi.getDelegatesWithVotes(payload.address).then(response => {
      if (response.success) {
        const votes = response.delegates.map(vote => vote.address)
        admApi.getDelegatesCount().then(response => {
          if (response.success) {
            for (let i = 0; i < response.count % constants.Delegates.ACTIVE_DELEGATES; i++) {
              _getDelegates(context, constants.Delegates.ACTIVE_DELEGATES, i * constants.Delegates.ACTIVE_DELEGATES, votes)
            }
          }
        })
      }
    })
  },
  voteForDelegates (context, payload) {
    context.commit('clean_delegates')
    context.commit('ajax_start', null, { root: true })
    admApi.voteForDelegates(payload.votes).then(response => {
      if (response.success) {
        context.commit('set_last_transaction_status', false)
        // removing an UI waiting state if transaction confirmation run to much time
        window.setTimeout(() => {
          context.commit('ajax_end', null, { root: true })
          context.dispatch('getDelegates', { address: payload.address })
        }, 15000)
        checkUnconfirmedTransactions(context)
      } else {
        context.commit('send_error', { msg: response.body.error }, { root: true })
        context.dispatch('getDelegates', { address: payload.address })
      }
    })
  },
  getForgingTimeForDelegate (context, delegate) {
    admApi.getNextForgers().then(response => {
      if (response.success) {
        const nextForgers = response.delegates
        const fIndex = nextForgers.indexOf(delegate.publicKey)
        const forgingTime = fIndex === -1 ? -1 : fIndex * 10
        context.commit('update_delegate', {
          address: delegate.address,
          params: { forgingTime: forgingTime }
        })
        admApi.getBlocks().then(response => {
          if (response.success) {
            let lastBlock = response.blocks[0]
            let blocks = response.blocks.filter(x => x.generatorPublicKey === delegate.publicKey)
            let time = Date.now()
            let status = { updatedAt: time }
            if (blocks.length > 0) {
              status.lastBlock = blocks[0]
              status.blockAt = new Date(((constants.EPOCH + status.lastBlock.timestamp) * 1000))
              var roundDelegates = getRoundDelegates(nextForgers, lastBlock.height)
              var isRoundDelegate = roundDelegates.indexOf(delegate.publicKey) !== -1
              status.networkRound = round(lastBlock.height)
              status.delegateRound = round(status.lastBlock.height)
              status.awaitingSlot = status.networkRound - status.delegateRound
            } else {
              status.lastBlock = null
            }
            if (status.awaitingSlot === 0) {
              // Forged block in current round
              status.code = 0
            } else if (!isRoundDelegate && status.awaitingSlot === 1) {
              // Missed block in current round
              status.code = 1
            } else if (!isRoundDelegate && status.awaitingSlot > 1) {
              // Missed block in current and last round = not forging
              status.code = 2
            } else if (status.awaitingSlot === 1) {
              // Awaiting slot, but forged in last round
              status.code = 3
            } else if (status.awaitingSlot === 2) {
              // Awaiting slot, but missed block in last round
              status.code = 4
            } else if (!status.blockAt || !status.updatedAt || status.lastBlock === null) {
              // Awaiting status or unprocessed
              status.code = 5
            // For delegates which not forged a signle block yet (statuses 0,3,5 not apply here)
            } else if (!status.blockAt && status.updatedAt) {
              if (!isRoundDelegate && delegate.missedblocks === 1) {
                // Missed block in current round
                status.code = 1
              } else if (delegate.missedblocks > 1) {
              // Missed more than 1 block = not forging
                status.code = 2
              } else if (delegate.missedblocks === 1) {
              // Missed block in previous round
                status.code = 4
              }
            } else {
              // Not Forging
              status.code = 2
            }
            context.commit('update_delegate', {
              address: delegate.address,
              params: { status: status.code }
            })
          }
        })
      }
    })
  },
  getForgedByAccount (context, delegate) {
    admApi.getForgedByAccount(delegate.publicKey).then(response => {
      if (response.success) {
        context.commit('update_delegate', {
          address: delegate.address,
          params: { forged: response.forged }
        })
      }
    })
  }
}
