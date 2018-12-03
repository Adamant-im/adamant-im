const audio = new Audio('/sound/bbpro_link.mp3')

const state = () => ({
  enabled: false
})

const actions = {
  play () {
    audio.play()
  }
}

export default {
  state,
  actions,
  namespaced: true
}
