export default {
  adm(state) {
    return Object.values(state.adm)
  },
  eth(state) {
    return Object.values(state.eth)
  },
  btc(state) {
    return Object.values(state.btc)
  },
  doge(state) {
    return Object.values(state.doge)
  },
  dash(state) {
    return Object.values(state.dash)
  },
  lsk(state) {
    return Object.values(state.lsk)
  },
  coins(state, getters) {
    return [...getters.eth, ...getters.btc, ...getters.doge, ...getters.dash, ...getters.lsk]
  }
}
