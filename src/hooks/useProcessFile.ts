import { computeCID, cropImage, FileData, readFileAsBuffer, readFileAsDataURL } from '@/lib/files'
import { encodeFile } from '@/lib/adamant-api'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAttachments } from '@/stores/attachments'
import { UPLOAD_MAX_FILE_SIZE } from '@/lib/constants'

function getImageResolution(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = (err) => {
      console.warn('Error loading image:', err)
      resolve({})
      URL.revokeObjectURL(img.src)
    }

    img.src = URL.createObjectURL(file)
  })
}

export function useProcessFile(partnerId: string) {
  const store = useStore()
  const attachments = useAttachments(partnerId)()
  const { t } = useI18n()

  async function processFile(file: File) {
    const hash = await attachments.hashFile(file)

    if ([...attachments.fileHashes.values()].includes(hash)) {
      store.dispatch('snackbar/show', {
        message: t('chats.duplicate', { name: file.name }),
        isError: true
      })
      return
    }

    const url = URL.createObjectURL(file)
    const tempCid = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const tempData: FileData = {
      cid: tempCid,
      name: file.name,
      type: file.type,
      content: url,
      encoded: null as any,
      isImage: file.type.includes('image/'),
      file,
      width: undefined,
      height: undefined
    }

    attachments.add([tempData])
    ;(async () => {
      const dataURL = await readFileAsDataURL(file)
      const arrayBuffer = await readFileAsBuffer(file)
      const { width, height } = await getImageResolution(file)
      const encodedFile = await encodeFile(arrayBuffer, { to: partnerId })

      // check actual file size after encoding
      if (encodedFile.binary.byteLength >= UPLOAD_MAX_FILE_SIZE) {
        store.dispatch('snackbar/show', {
          message: t('chats.max_file_size', { count: UPLOAD_MAX_FILE_SIZE }),
          isError: true
        })
        const idx = attachments.list.findIndex((f) => f.cid === tempCid)
        attachments.remove(idx)
        return
      }

      const cid = await computeCID(encodedFile.binary)

      store.commit('attachment/setAttachment', { cid, url })

      const finalData: FileData = {
        ...tempData,
        cid,
        content: dataURL,
        encoded: encodedFile,
        width,
        height
      }

      if (file.type.startsWith('image/')) {
        const previewFile = await cropImage(file)
        const previewDataURL = await readFileAsDataURL(previewFile)
        const previewArrayBuffer = await readFileAsBuffer(previewFile)
        const { width: previewWidth, height: previewHeight } = await getImageResolution(previewFile)
        const previewEncodedFile = await encodeFile(previewArrayBuffer, { to: partnerId })
        const previewCid = await computeCID(previewEncodedFile.binary)

        const previewUrl = URL.createObjectURL(
          new Blob([previewArrayBuffer], { type: previewFile.type })
        )

        finalData.preview = {
          cid: previewCid,
          file: previewFile,
          encoded: previewEncodedFile,
          content: previewDataURL,
          width: previewWidth!,
          height: previewHeight!
        }

        store.commit('attachment/setAttachment', { cid: previewCid, url: previewUrl })
      }

      attachments.replaceByCid(tempCid, finalData)
    })()
  }

  return {
    processFile
  }
}
