import config from '@/config'
import type { Service } from '@/types/wallets'
import { IpfsClient } from './IpfsClient'

// Only the IPFS service entry may set this floor. ADM node versions and a shared
// `services.minVersion` describe different APIs and must not gate IPFS nodes.
// An unset value keeps IpfsClient's default (`0.0.0`).
const ipfsService = config.adm.services.ipfsNode as Service

export const ipfs = new IpfsClient(ipfsService.list, ipfsService.minVersion)

export default ipfs
