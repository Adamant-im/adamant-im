export default {
  /*  Usage: getAvailableServer(key)
      key - 'adm', 'eth'
      Returns {ip, protocol, port, online}
  */
  getAvailableServer: state => key => {
    const serverList = state.domain[key].serverList
    let server = serverList[0]
    let onlineList = serverList.filter(o => o.online)
    if (onlineList.length > 0) {
      server = onlineList[ Math.floor(Math.random() * onlineList.length) ]
    }
    return server
  }
}
