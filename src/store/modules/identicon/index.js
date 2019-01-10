/**
 * type Avatar {
 *   userId: string,
 *   Base64: string, // image Base64 data
 * }
 */
const state = () => ({
  avatars: []
})

const getters = {
  avatar: state => userId => {
    const avatar = state.avatars.find(
      avatar => avatar.userId === userId
    )

    return (avatar && avatar.Base64) || null
  },
  isAvatarCached: (state, getters) => userId => !!getters.avatar(userId)
}

const mutations = {
  setAvatar (state, { userId, Base64 }) {
    state.avatars.push({
      userId,
      Base64
    })
  }
}

const actions = {
  saveAvatar ({ commit, getters }, { userId, Base64 }) {
    if (!getters.isAvatarCached(userId)) {
      commit('setAvatar', { userId, Base64 })
    }
  }
}

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true
}
