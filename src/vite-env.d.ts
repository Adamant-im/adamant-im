/// <reference types="vite/client" />

declare module 'virtual:adamant-build-info' {
  export interface BuildMetadata {
    version: string
    branch: string
    commit: string
    prNumber: string | null
    author: string
    buildDate: string
    isTestnet: boolean
  }

  const buildInfo: BuildMetadata
  export default buildInfo
}
