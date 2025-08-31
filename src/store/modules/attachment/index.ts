import { MutationTree, GetterTree, ActionTree } from 'vuex'
import { RootState } from '@/store/types'
import { AttachmentsState } from '@/store/modules/attachment/types'
import { AttachmentApi } from '@/lib/attachment-api'

const state = (): AttachmentsState => ({
  attachments: {},
  uploadProgress: {},
  downloadProgress: {}
})

const mutations: MutationTree<AttachmentsState> = {
  setAttachment(state, { cid, url }) {
    state.attachments = { ...state.attachments, [cid]: url }
  },

  setUploadProgress(state, { cid, progress }: { cid: string; progress: number }) {
    state.uploadProgress[cid] = progress
  },

  resetUploadProgress(state, { cid }: { cid: string }) {
    delete state.uploadProgress[cid]
  },

  setDownloadProgress(state, { cid, progress }: { cid: string; progress: number }) {
    state.downloadProgress[cid] = progress
  },

  resetDownloadProgress(state, { cid }: { cid: string }) {
    delete state.downloadProgress[cid]
  },

  reset(state) {
    state.attachments = {}
  }
}

const getters: GetterTree<AttachmentsState, RootState> = {
  getImageUrl: (state) => (cid: string) => {
    return state.attachments[cid]
  },
  getUploadProgress: (state) => (cid: string) => {
    return state.uploadProgress[cid] ?? 100
  },
  getDownloadProgress: (state) => (cid: string) => {
    return state.downloadProgress[cid] ?? 100
  },
  isUploadInProgress(state) {
    for (const progress of Object.values(state.uploadProgress)) {
      if (progress < 100) return true
    }

    return false
  },
  isDownloadInProgress(state) {
    for (const progress of Object.values(state.downloadProgress)) {
      if (progress < 100) return true
    }

    return false
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
    {
      cid,
      publicKey,
      nonce
    }: {
      cid: string
      publicKey: string
      nonce: string
    }
  ) {
    if (state.attachments[cid]) {
      return state.attachments[cid]
    } else {
      try {
        const onDownloadProgress = (progress: number) => {
          commit('setDownloadProgress', {
            cid,
            progress
          })
        }

        const fileData = await attachmentApi?.getFile(cid, nonce, publicKey, onDownloadProgress)

        commit('resetDownloadProgress', { cid })

        if (!fileData) {
          throw new Error('Failed to fetch image')
        }

        const blob = new Blob([fileData], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        commit('setAttachment', { cid, url })
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
  reset: {
    root: true,
    handler({ state, commit }) {
      for (const fileUrl of Object.values(state.attachments)) {
        URL.revokeObjectURL(fileUrl)
      }
      commit('reset')
    }
  }
}

export default {
  state,
  mutations,
  getters,
  actions,
  namespaced: true
}
