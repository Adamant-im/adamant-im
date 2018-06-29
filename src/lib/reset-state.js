/**
 * Helper function to reset the Vuex state to the supplied `initialState`
 * @param {object} state Vuex state
 * @param {object} initialState initial state to reset to
 */
export function resetState (state, initialState) {
  Object.keys(state).forEach(field => {
    state[field] = initialState[field]
  })
}

/**
 * Vuex module action to reset the state
 */
export const resetAction = {
  root: true,
  handler: context => context.commit('reset')
}
