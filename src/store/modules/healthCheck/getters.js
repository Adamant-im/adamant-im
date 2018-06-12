export default {
  onlineServer: state => {
    let server = state.serverList[0]
    let onlineList = state.serverList.filter(o => o.online)
    if (onlineList.length > 0) {
      server = onlineList[ Math.floor(Math.random() * onlineList.length) ]
    }
    return server
  }
}
