import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld(
  'adamantDesktop',
  Object.freeze({
    isElectron: true as const
  })
)
