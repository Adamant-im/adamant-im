import config from '@/config'
import { NodeInfo } from '@/types/wallets'
import { EthIndexerClient } from './EthIndexerClient'

const endpoints = (config.eth.nodes as NodeInfo[])
  .filter((node) => node.hasIndex)
  .map((endpoint) => endpoint.url)
export const ethIndexer = new EthIndexerClient(endpoints)

export default ethIndexer
