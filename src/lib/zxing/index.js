import { BrowserQRCodeReader } from '@zxing/library'

export class Scanner {
  constructor ({ videoElement }) {
    this.codeReader = new BrowserQRCodeReader()
    this.videoElement = videoElement
  }

  start (deviceId) {
    return this.codeReader.decodeFromInputVideoDevice(deviceId, this.videoElement)
      .then((result) => {
        return result.text
      })
  }

  stop () {
    this.codeReader.reset()
  }

  getCameras () {
    return this.codeReader.getVideoInputDevices()
  }
}
