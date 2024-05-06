import { MutationTree, GetterTree, ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { AttachmentsState } from '@/store/modules/attachment/types.ts'
import { AttachmentApi } from '@/lib/attachment-api'

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

let attachmentApi: AttachmentApi | null = null
const actions: ActionTree<AttachmentsState, RootState> = {
  afterLogin: {
    root: true,
    handler(context, passphrase) {
      attachmentApi = new AttachmentApi(passphrase)
    }
  },
  getAttachment(
    state,
    { cid, publicKey, nonce }: { cid: string; publicKey: Uint8Array; nonce: string }
  ) {
    return attachmentApi?.getFile(cid, nonce, publicKey)
  },
  uploadAttachment(
    state,
    { cid, publicKey, nonce }: { cid: string; publicKey: Uint8Array; nonce: string }
  ) {
    return attachmentApi?.getFile(cid, nonce, publicKey)
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
