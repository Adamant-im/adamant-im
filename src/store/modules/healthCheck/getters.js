export default {
  // TODO Usage
  getAvailableServer: state => key => {
    let server = state[key].serverList[0]
    let onlineList = state[key].serverList.filter(o => o.online)
    if (onlineList.length > 0) {
      server = onlineList[ Math.floor(Math.random() * onlineList.length) ]
    }
    return server
  }
}
