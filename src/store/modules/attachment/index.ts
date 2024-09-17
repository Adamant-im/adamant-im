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

  setAttachment(state, { сid, url }) {
    state.attachments = { ...state.attachments, [сid]: url }
    console.log(state.attachments)
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
    _context,
    { cid, publicKey, nonce }: { cid: string; publicKey: string; nonce: string }
  ) {
    return attachmentApi?.getFile(cid, nonce, publicKey)
  },
  async getAttachmentUrl(
    { state, commit },
    { cid, publicKey, nonce }: { cid: string; publicKey: string; nonce: string }
  ) {
    if (state.attachments[cid]) {
      return state.attachments[cid]
    } else {
      try {
        const fileData = await attachmentApi?.getFile(cid, nonce, publicKey)
        if (!fileData) {
          throw new Error('Failed to fetch image')
        }

        const blob = new Blob([fileData], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        if (fileData !== undefined) {
          commit('setAttachment', { cid, url })
        }
        return url
      } catch (error) {
        console.error('Error fetching image:', error)
        throw error
      }
    }
  },
  async uploadAttachment(state, { file, publicKey }: { file: Uint8Array; publicKey: string }) {
    return attachmentApi?.uploadFile(file, publicKey)
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
