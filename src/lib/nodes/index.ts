import { adm } from './adm'
import { btc } from './btc'
import { dash } from './dash'
import { doge } from './doge'
import { eth } from './eth'
import { lsk } from './lsk'
import { ethIndexer } from './eth-indexer'
import { lskIndexer } from './lsk-indexer'

export const nodes = {
  adm,
  btc,
  dash,
  doge,
  eth,
  lsk
}

export const services = {
  ethIndexer,
  lskIndexer
}
