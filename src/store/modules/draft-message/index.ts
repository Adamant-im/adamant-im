import { MutationTree, GetterTree, ActionTree } from 'vuex'
import { RootState } from '@/store/types'

export interface DraftState {
  drafts: { [key: string]: { replyToId?: string; message?: string } }
}

const state = (): DraftState => ({
  drafts: {}
})

const mutations: MutationTree<DraftState> = {
  saveReplyToId(state, payload: { partnerId: string; replyToId: string }) {
    if (state.drafts[payload.partnerId]) {
      state.drafts[payload.partnerId].replyToId = payload.replyToId
    } else {
      state.drafts[payload.partnerId] = {
        replyToId: payload.replyToId
      }
    }
  },

  saveMessage(state, payload: { partnerId: string; message: string }) {
    if (state.drafts[payload.partnerId]) {
      state.drafts[payload.partnerId].message = payload.message
    } else {
      state.drafts[payload.partnerId] = {
        message: payload.message
      }
    }
  },

  deleteReplyTold(state, payload: { partnerId: string; replyToId: string }) {
    delete state.drafts[payload.partnerId].replyToId
  },

  deleteMessage(state, payload: { partnerId: string; message: string }) {
    delete state.drafts[payload.partnerId].message
  },

  reset(state) {
    state.drafts = {}
  }
}

const getters: GetterTree<DraftState, RootState> = {
  draftMessage: (state) => (partnerId: string) => {
    const objMessage = state.drafts[partnerId]
    if (objMessage) {
      return objMessage.message
    } else {
      return ''
    }
  },

  draftReplyTold: (state) => (partnerId: string) => {
    const objMessage = state.drafts[partnerId]
    if (objMessage) {
      return objMessage.replyToId
    } else {
      return ''
    }
  }
}

const actions: ActionTree<DraftState, RootState> = {
  deleteDraft(context, payload: { partnerId: string }) {
    context.commit('deleteReplyTold', payload)
    context.commit('deleteMessage', payload)
  }
}

export default {
  state,
  mutations,
  getters,
  actions,
  namespaced: true
}
