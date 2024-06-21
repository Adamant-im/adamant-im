import type { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import type { Exception, Result } from '@zxing/library'

type DecodeContinuouslyCallback = (
  result?: Result,
  error?: Exception,
  controls?: IScannerControls
) => void
export class Scanner {
  cameraStream!: MediaStream
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
    // Wait for camera stream and only after that request a list of input devices
    this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
    return this.cameraStream ? BrowserCodeReader.listVideoInputDevices() : []
  }

  stop(controls: IScannerControls) {
    // Stop all tracks from the requested media stream before controls stopping
    this.cameraStream.getVideoTracks().forEach((track) => track.stop())
    controls.stop()
  }
}
