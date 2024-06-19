import type { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import type { Result } from '@zxing/library'

type DecodeContinuouslyCallback = (result?: Result) => void
export class Scanner {
  codeReader!: BrowserQRCodeReader
  videoElement: HTMLVideoElement

  constructor({ videoElement }: { videoElement: HTMLVideoElement }) {
    this.videoElement = videoElement
  }

  async init() {
    const { BrowserQRCodeReader } = await import('@zxing/browser')
    this.codeReader = new BrowserQRCodeReader()
  }

  async start(deviceId: string, decodeCallback: DecodeContinuouslyCallback) {
    return this.codeReader.decodeFromVideoDevice(deviceId, this.videoElement, decodeCallback)
  }

  async getCameras() {
    const { BrowserCodeReader } = await import('@zxing/browser')
    return BrowserCodeReader.listVideoInputDevices()
  }

  stop(controls: IScannerControls) {
    controls.stop()
  }
}
