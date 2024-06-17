import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { DecodeContinuouslyCallback } from '@zxing/browser/esm/common/DecodeContinuouslyCallback'

export class Scanner {
  codeReader!: BrowserQRCodeReader
  videoElement: HTMLVideoElement

  constructor({ videoElement }: { videoElement: HTMLVideoElement }) {
    this.videoElement = videoElement
  }

  async init() {
    const { BrowserCodeReader, BrowserQRCodeReader } = await import('@zxing/browser')

    this.codeReader = new BrowserQRCodeReader()

    return new (BrowserCodeReader.listVideoInputDevices as any)()
  }

  async start(deviceId: string, decodeCallback: DecodeContinuouslyCallback) {
    return this.codeReader.decodeFromVideoDevice(deviceId, this.videoElement, decodeCallback)
  }

  stop(controls: IScannerControls) {
    controls.stop()
  }
}
