import { MutationTree, GetterTree, ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import axios from 'axios'
import { getRandomServiceUrl } from '@/config/utils'
import { AttachmentsState } from '@/store/modules/attachment/types.ts'

const state = (): AttachmentsState => ({
  attachments: {}
})

const mutations: MutationTree<AttachmentsState> = {
  setAttachments(state, attachments) {
    // TODO: Poor realization
    state.attachments = attachments
  },

  reset(state) {
    state.attachments = {}
  }
}

const getters: GetterTree<AttachmentsState, RootState> = {
  getFileMessage: (state) => (id: string) => {
    const objMessage = state.attachments[id]
    if (objMessage?.files) {
      return objMessage.files
    }
  }
}

const actions: ActionTree<AttachmentsState, RootState> = {
  getAttachment({ commit }, cid: string) {
    const url = getRandomServiceUrl('adm', 'attachmentService')
    return new Promise((resolve, reject) => {
      axios
        .get(`${url}/file/${cid}`)
        .then((res) => {
          const responce = res.data
          commit('setAttachments', responce)
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  resetState(context) {
    context.commit('reset')
  }
}

export default {
  state,
  mutations,
  getters,
  actions,
  namespaced: true
}
