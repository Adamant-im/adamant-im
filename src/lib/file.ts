import { FileData } from '@/components/UploadFile.vue'
import { EncodedFile } from '@/lib/adamant-api'
import ipfs from '@/lib/nodes/ipfs'

export function readFileAsDataURL(file: File): Promise<{ raw: Uint8Array; dataURL: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      resolve({
        raw: new Uint8Array(reader.result as ArrayBuffer),
        dataURL: e.target?.result as string
      })
    }
    reader.readAsDataURL(file)
  })
}

export function readFileAsBuffer(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      // Convert the ArrayBuffer to a Uint8Array
      const arrayBuffer = reader.result as ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer)
      resolve(uint8Array)
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsArrayBuffer(file)
  })
}

export async function uploadFiles(files: FileData[], encodedFiles: EncodedFile[]) {
  const formData = new FormData()

  for (const [index, file] of Object.entries(files)) {
    const encodedFile = encodedFiles[+index]?.binary
    if (!encodedFile) {
      throw new Error(`Missing binary data for ${file.file.name}`)
    }

    const blob = new Blob([encodedFile], { type: 'application/octet-stream' })
    formData.append('files', blob, file.file.name)
  }

  const response = await ipfs.upload(formData, (progress) => {
    const percentCompleted = Math.round((progress.loaded * 100) / (progress.total || 0))

    console.log(`Progress ${percentCompleted}%`)
  })
  console.log(`Uploaded CIDs`, response)

  return response
}

/**
 * Compute CID for a file
 */
export async function computeCID(fileOrBytes: File | Uint8Array) {
  const { CID } = await import('multiformats/cid')
  const { code } = await import('multiformats/codecs/raw')
  const { sha256 } = await import('multiformats/hashes/sha2')

  const bytes =
    fileOrBytes instanceof File ? new Uint8Array(await fileOrBytes.arrayBuffer()) : fileOrBytes

  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, code, hash)

  return cid.toString()
}
