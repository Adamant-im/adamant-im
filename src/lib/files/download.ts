import { Directory, Filesystem, WriteFileResult } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { FileOpener } from '@capacitor-community/file-opener'
import { FileAsset } from '@/lib/adamant-api/asset'
import { LocalFile } from '@/lib/files/types'
import { isLocalFile } from '@/lib/files/guards'

export const downloadFileNatively = async (
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

export const downloadFileByUrl = async (url: string, filename = 'unnamed') => {
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

export const getAttachmentPayload = (file: FileAsset | LocalFile, publicKey?: string) => {
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

export const getFileName = (file: FileAsset | LocalFile) => {
  if (isLocalFile(file)) {
    return file.file.name || undefined
  }
  if (!file.name) return undefined
  return file.extension ? `${file.name}.${file.extension}` : file.name
}
