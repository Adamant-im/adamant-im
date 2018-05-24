import config from '../../../config.json'
import EthApi from '../../../lib/ethereum-api'

const servers = config.server.eth
const server = servers[Math.floor(Math.random() * servers.length)]
const api = new EthApi(server)

function unlockApi (context) {
  if (api.isUnlocked) return
  const passphrase = context.rootState.passPhrase
  api.unlock(passphrase)
}

export default {
  login (context, passphrase) {
    api.unlock(passphrase)
    context.commit('address', api.address)
  },

  updateBalance (context) {
    unlockApi(context)
    api.getBalance().then(
      balance => context.commit('balance', balance),
      error => console.error('Failed to update ETH balance', error)
    )
  }
}
