import { Directory, Filesystem, WriteFileResult } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { FileOpener } from '@capacitor-community/file-opener'
import { computed, ref } from 'vue'
import { FileAsset } from '@/lib/adamant-api/asset'
import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { isLocalFile, LocalFile } from '@/lib/files'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export function useDownloadFile(
  transaction: NormalizedChatMessageTransaction,
  fileToDownload: FileAsset | LocalFile
) {
  const store = useStore()
  const { t } = useI18n()

  const downloading = ref(false)

  const publicKey = computed(() =>
    transaction.senderId === store.state.address
      ? transaction.recipientPublicKey
      : transaction.senderPublicKey
  )

  const delay = async (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const downloadFileNatively = async (
    blobUrl: string,
    filename: string
  ): Promise<WriteFileResult> => {
    const response = await fetch(blobUrl)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)

      reader.onloadend = async () => {
        const base64Data = reader.result?.toString().split(',')[1]

        Filesystem.writeFile({
          path: filename,
          data: base64Data!,
          directory: Directory.Data
        })
          .then(resolve)
          .catch(reject)
      }

      reader.onerror = reject
    })
  }

  const downloadFileByUrl = async (url: string, filename = 'unnamed') => {
    if (Capacitor.isNativePlatform()) {
      const fileResult = await downloadFileNatively(url, filename)
      await FileOpener.open({ filePath: fileResult.uri })

      return
    }

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename

    document.body.appendChild(anchor)
    anchor.click()

    document.body.removeChild(anchor)
  }

  const getAttachmentPayload = (file: FileAsset | LocalFile, publicKey?: string) => {
    if (isLocalFile(file)) {
      return {
        cid: file.file.cid,
        publicKey: publicKey,
        nonce: file.file.encoded.nonce
      }
    }
    return {
      cid: file.id,
      publicKey: publicKey,
      nonce: file.nonce
    }
  }

  const getFileName = (file: FileAsset | LocalFile) => {
    if (isLocalFile(file)) {
      return file.file.name || undefined
    }
    if (!file.name) return undefined
    return file.extension ? `${file.name}.${file.extension}` : file.name
  }

  const downloadFile = async () => {
    try {
      downloading.value = true

      const payload = getAttachmentPayload(fileToDownload, publicKey.value)
      const imageUrl = await store.dispatch('attachment/getAttachmentUrl', payload)

      const fileName = getFileName(fileToDownload)
      await downloadFileByUrl(imageUrl, fileName)
    } catch {
      void store.dispatch('snackbar/show', {
        message: t('chats.file_not_found'),
        isError: true
      })
    } finally {
      await delay(200) // show loading spinner at least 200ms for smoother UI
      downloading.value = false
    }
  }

  return {
    downloading,
    downloadFileNatively,
    downloadFileByUrl,
    downloadFile
  }
}
