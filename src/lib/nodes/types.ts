export type NodeStatus =
  | 'online' // node is online and fully functional
  | 'offline' // node is offline
  | 'disabled' // user disabled the node
  | 'sync' // node is out of sync (too low block height)
  | 'unsupported_version' // node version is too low

export type NodeType = 'adm' | 'eth' | 'btc' | 'doge' | 'dash' | 'lsk'
