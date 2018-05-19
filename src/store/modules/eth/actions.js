import config from '../../../config.json'
import EthApi from '../../../lib/ethereum-api'

const servers = config.server.eth
const server = servers[Math.floor(Math.random() * servers.length)]
const api = new EthApi(server)

export default {
  login (context, passphrase) {
    api.unlock(passphrase)
    context.commit('address', api.getAddress())
  },

  updateBalance (context) {
    api.getBalance().then(
      balance => context.commit('balance', balance),
      error => console.error('Failed to update ETH balance', error)
    )
  }
}
