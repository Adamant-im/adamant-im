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

  async start(currentCamera: number | null, decodeCallback: DecodeContinuouslyCallback) {
    // Stop all tracks from media stream before camera changing
    if (this.cameraStream) this.stopVideoTracks()

    // Request new media stream and attach to video element as source object
    const facingMode = currentCamera === 1 ? 'environment' : 'user'
    this.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false
    })
    this.videoElement.srcObject = this.cameraStream

    return this.codeReader.decodeFromVideoElement(this.videoElement, decodeCallback)
  }

  async getCameras() {
    // Get only first two video devices. First - front camera, second (if available) - back camera
    return (await navigator.mediaDevices.enumerateDevices())
      .filter((device: MediaDeviceInfo) => device.kind === 'videoinput')
      .slice(0, 2)
  }

  stop(controls: IScannerControls) {
    // Stop all tracks from the requested media stream before controls stopping
    this.stopVideoTracks()
    controls.stop()
  }

  private stopVideoTracks() {
    this.cameraStream.getVideoTracks().forEach((track) => track.stop())
  }
}
