import { describe, expect, it } from 'vitest'

import { getNativeAttachmentPath, NATIVE_ATTACHMENT_DIRECTORY } from './nativeAttachmentPath'

describe('getNativeAttachmentPath', () => {
  it('stores regular files in the dedicated attachment directory', () => {
    expect(getNativeAttachmentPath('photo.jpg')).toBe('attachments/photo.jpg')
  })

  it.each(['../secret.txt', '..\\secret.txt', '/tmp/secret.txt'])(
    'removes directory components from %s',
    (filename) => {
      expect(getNativeAttachmentPath(filename)).toBe('attachments/secret.txt')
    }
  )

  it.each(['', '.', '..', 'folder/'])('uses a fallback name for %j', (filename) => {
    expect(getNativeAttachmentPath(filename)).toBe('attachments/unnamed')
  })

  it('keeps the directory name aligned with the Android FileProvider path', () => {
    expect(NATIVE_ATTACHMENT_DIRECTORY).toBe('attachments')
  })
})
