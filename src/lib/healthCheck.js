/*
    Health check support for PWA etc.
*/
class HealthChecker {
  /*
  p - object with parameters:
      requester - object of library popsicle or vue-resource,
          should provide method get() -> Promise
      urls - [{ip, protocol, port}]
      onStatusChange - callback to be called with args:
          urls - [{ip, protocol, port, online}]
      probeDelay - interval of probing, seconds, default 60
  */
  constructor (p) {
    this.requester = p.requester
    this.urls = p.urls || []
    this.onStatusChange = p.onStatusChange
    this.probeDelay = p.probeDelay || 60
    this.lastStatusList = null
    this.intId = null
  }

  // Start probing
  start () {
    this.stop()
    this.probe()
    this.intId = setInterval(
      this.probe.bind(this),
      this.probeDelay * 1000)
  }

  // Stop probing
  stop () {
    if (this.intId) {
      clearInterval(this.intId)
      this.intId = null
    }
  }

  // Probe given urls
  probe () {
    // Wait for all probes
    Promise.all(this.urls.map(o => new Promise((resolve, reject) => {
      this.requester.get(makeUrl(o))
        .then(() => resolve(true))
        .catch(() => resolve(false))
    })))
      .then(resList => this.compareStatus(resList))
      .catch(err => console.log(err))
  }

  /*  Compare newStatusList and lastStatusList
      newStatusList - [bool]
  */
  compareStatus (newStatusList) {
    if (this.lastStatusList) {
      // Compare new status with last
      let changed = false
      for (let i = 0; i < newStatusList.length; i++) {
        if (newStatusList[i] !== this.lastStatusList[i]) {
          changed = true
          break
        }
      }

      if (changed) {
        // Fire user callback
        this.onStatusChange(this.urls.map((obj, i) => ({
          ...obj,
          online: newStatusList[i]
        })))
      }
    }

    this.lastStatusList = newStatusList
  }
}

/*  Make an URL for probing
    o - {ip, protocol, port}
    Returns string
*/
function makeUrl (o) {
  let url = o.protocol + '://' + o.ip
  if (o.port) {
    url += ':' + o.port
  }
  return url
}

export default HealthChecker
