import { ref } from 'vue'
import { defineStore } from 'pinia'

import { FileData } from '@/lib/files'
import { UPLOAD_MAX_FILE_COUNT, UPLOAD_MAX_FILE_SIZE } from '@/lib/constants'

export const useAttachments = (admAddress: string) =>
  defineStore(`attachments-${admAddress}`, () => {
    const list = ref<FileData[]>([])
    const fileHashes = ref<Map<string, string>>(new Map())

    const hashFile = async (file: File) => {
      const sliceSize = 1024 * 1024 // 1 MB
      const size = file.size

      // take 3 positions (beginning, mid, end) to avoid collision
      const positions = [
        0,
        Math.max(0, Math.floor(size / 2) - Math.floor(sliceSize / 2)),
        Math.max(0, size - sliceSize)
      ]

      const buffers = await Promise.all(
        positions.map(async (pos) => {
          const blob = file.slice(pos, pos + sliceSize)
          return await blob.arrayBuffer()
        })
      )

      const totalLength = buffers.reduce((acc, b) => acc + b.byteLength, 0)
      const tmp = new Uint8Array(totalLength)
      let offset = 0
      for (const buf of buffers) {
        tmp.set(new Uint8Array(buf), offset)
        offset += buf.byteLength
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', tmp)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    }

    const add = async (filesList: FileData[]) => {
      for (const file of filesList) {
        const hash = await hashFile(file.file)

        fileHashes.value.set(file.cid, hash)
      }

      list.value = [...list.value, ...filesList]
        .filter((file) => file.file.size < UPLOAD_MAX_FILE_SIZE)
        .slice(0, UPLOAD_MAX_FILE_COUNT)
    }

    const remove = (index: number) => {
      const file = list.value[index]

      fileHashes.value.delete(file.cid)
      list.value = list.value.filter((_, i) => i !== index)
    }

    // called after encoding is finished to add actual cid
    const replaceByCid = async (oldCid: string, file: FileData) => {
      const hash = await hashFile(file.file)
      const idx = list.value.findIndex((f) => f.cid === oldCid)

      fileHashes.value.delete(oldCid)
      fileHashes.value.set(file.cid, hash)
      if (idx !== -1) {
        list.value.splice(idx, 1, file)
      }
    }

    const isLoading = (file: FileData) => {
      return file.cid.startsWith('temp-')
    }

    const $reset = () => {
      list.value = []
      fileHashes.value = new Map<string, string>()
    }

    return {
      list,
      fileHashes,
      $reset,
      add,
      remove,
      replaceByCid,
      isLoading,
      hashFile
    }
  })
