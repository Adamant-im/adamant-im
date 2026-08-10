export {}

declare global {
  interface Window {
    adamantDesktop?: Readonly<{
      isElectron: true
    }>
  }
}
