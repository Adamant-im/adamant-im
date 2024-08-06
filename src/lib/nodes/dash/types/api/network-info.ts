type Network = {
  name: string
  limited: boolean
  reachable: boolean
  proxy: string
  proxy_randomize_credentials: boolean
}

type LocalAddress = {
  address: string
  port: number
  score: number
}

export type NetworkInfo = {
  version: number
  buildversion: string
  subversion: string
  protocolversion: number
  localservices: string
  localservicesnames: string[]
  localrelay: boolean
  timeoffset: number
  networkactive: boolean
  connections: number
  inboundconnections: number
  outboundconnections: number
  mnconnections: number
  inboundmnconnections: number
  outboundmnconnections: number
  socketevents: string
  networks: Network[]
  relayfee: number
  incrementalfee: number
  localaddresses: LocalAddress[]
  warnings: string
}
