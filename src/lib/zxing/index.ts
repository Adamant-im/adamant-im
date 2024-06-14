import { BrowserCodeReader, BrowserQRCodeReader, IScannerControls } from '@zxing/browser'

export class Scanner {
  codeReader!: BrowserQRCodeReader
  videoElement: HTMLVideoElement

  constructor({ videoElement }: { videoElement: HTMLVideoElement }) {
    this.videoElement = videoElement
  }

  async init() {
    this.codeReader = new BrowserQRCodeReader()
  }

  async start(deviceId: string, decodeCallback: any) {
    return this.codeReader.decodeFromVideoDevice(deviceId, this.videoElement, decodeCallback)
  }

  stop(controls: IScannerControls) {
    controls.stop()
  }

  async getCameras(): Promise<MediaDeviceInfo[]> {
    return await new (BrowserCodeReader.listVideoInputDevices as any)()
  }
}
