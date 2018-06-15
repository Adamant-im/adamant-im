export default {
  /*  Usage: getAvailableServer(key)
      key - 'adm', 'eth'
      Returns {ip, protocol, port, online}
  */
  getAvailableServer: state => key => {
    let server = state[key].serverList[0]
    let onlineList = state[key].serverList.filter(o => o.online)
    if (onlineList.length > 0) {
      server = onlineList[ Math.floor(Math.random() * onlineList.length) ]
    }
    return server
  }
}
