import baseMutations from '../btc-base/btc-base-mutations'
import state from './btc-state'

export default {
  ...baseMutations(state)
}
