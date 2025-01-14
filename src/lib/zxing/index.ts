import type { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import type { Exception, Result } from '@zxing/library'

type DecodeContinuouslyCallback = (
  result?: Result,
  error?: Exception,
  controls?: IScannerControls
) => void

type ModalErrorCallback = (error: Error) => void

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

  async start(
    currentCamera: number | null,
    decodeCallback: DecodeContinuouslyCallback,
    modalCallback: ModalErrorCallback
  ) {
    // Stop all tracks from media stream before camera changing
    if (this.cameraStream) this.stopVideoTracks()

    try {
      // Request new media stream and attach to video element as source object
      const facingMode = currentCamera === 1 ? 'environment' : 'user'
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      })
      this.videoElement.srcObject = this.cameraStream

      this.codeReader.decodeFromVideoElement(this.videoElement, decodeCallback)
    } catch (error) {
      // If something went wrong, show the reason in the modal window
      modalCallback(error as Error)
    }
  }

  async getCameras() {
    const deviceCameras = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === 'videoinput'
    )

    // Change only two video devices. First - front camera, second (is available) - back camera
    const cameras: MediaDeviceInfo[] = []
    if (deviceCameras.length > 0) {
      cameras.push(deviceCameras[0])

      if (deviceCameras.length > 1) {
        let backCamera: MediaDeviceInfo | undefined
        if (navigator.userAgent.includes('iPhone')) {
          // On iOS devices the device name can be localized
          // But the second camera is back
          backCamera = deviceCameras[1]
        } else {
          // Devices with other mobile os may have two front cameras
          // So let's take first back camera
          backCamera = deviceCameras.slice(1).find((device) => device.label.includes('back'))
        }

        if (backCamera) cameras.push(backCamera)
      }
    }

    return cameras
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
