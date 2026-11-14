import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadFile } from '@/lib/textHelpers'

describe('downloadFile', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it.each([
    ['text fixture', 'backup.txt', 'text/plain'],
    [Uint8Array.of(137, 80, 78, 71), 'adamant-im.png', 'image/png']
  ])('downloads %s and revokes the URL after WebKit can start the download', (data, name, type) => {
    vi.useFakeTimers()
    const url = 'blob:download-fixture'
    const createObjectURL = vi.fn(() => url)
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.isConnected).toBe(true)
      expect(this.download).toBe(name)
      expect(this.href).toBe(url)
    })

    downloadFile(data, name, type)

    expect(createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ type }))
    expect(click).toHaveBeenCalledOnce()
    expect(click.mock.contexts[0].isConnected).toBe(false)
    vi.advanceTimersByTime(39_999)
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith(url)
  })
})
