export type IndexStatus = {
  data: {
    genesisHeight: number
    lastBlockHeight: number
    lastIndexedBlockHeight: number
    chainLength: number
    numBlocksIndexed: number
    percentageIndexed: number
    isIndexingInProgress: boolean
  }
  meta: {
    lastUpdate: number
  }
}
