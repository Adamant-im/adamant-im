export const TABS = {
  adm: 'adm',
  coins: 'coins',
  services: 'services',
  ipfs: 'ipfs'
} as const

export type Tab = (typeof TABS)[keyof typeof TABS]
