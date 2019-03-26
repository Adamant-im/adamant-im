export class Scanner {
  constructor ({ videoElement }) {
    this.videoElement = videoElement
  }

  async init () {
    const { BrowserQRCodeReader } = await import(
      /* webpackChunkName: "zxing" */
      '@zxing/library'
    )

    this.codeReader = new BrowserQRCodeReader()
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
