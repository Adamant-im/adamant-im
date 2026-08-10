export const NATIVE_ATTACHMENT_DIRECTORY = 'attachments'

const getBaseName = (filename: string) => filename.replaceAll('\\', '/').split('/').at(-1) ?? ''

export function getNativeAttachmentPath(filename: string) {
  const baseName = getBaseName(filename)
  const safeName = baseName && baseName !== '.' && baseName !== '..' ? baseName : 'unnamed'

  return `${NATIVE_ATTACHMENT_DIRECTORY}/${safeName}`
}
