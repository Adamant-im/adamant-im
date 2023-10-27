import config from '../production.json'

export type Config = typeof config
export type BlockchainSymbol = keyof Config
