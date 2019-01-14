export default class Blinker {
  constructor (documentTitle, interval = 1000) {
    this.documentTitle = documentTitle
    this.interval = interval
  }

  stop () {
    clearInterval(this.intervalRef)
    this.intervalRef = null

    document.title = this.documentTitle
  }

  start (notifyMessage) {
    this.notifyMessage = notifyMessage
    let isNotify = false

    if (this.intervalRef) {
      return
    }

    this.intervalRef = setInterval(() => {
      isNotify = !isNotify

      if (isNotify) {
        document.title = this.notifyMessage
      } else {
        document.title = this.documentTitle
      }
    }, this.interval)
  }
}
