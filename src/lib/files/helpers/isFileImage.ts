import { FileAsset } from '@/lib/adamant-api/asset'
import { isLocalFile, LocalFile } from '@/lib/files'
import { ALLOWED_IMAGE_EXTENSIONS } from '@/lib/constants'

export function isFileImage(file: FileAsset | LocalFile) {
  if (isLocalFile(file)) {
    return file.file.isImage
  }

  return file.extension ? ALLOWED_IMAGE_EXTENSIONS.includes(file.extension) : false
}
