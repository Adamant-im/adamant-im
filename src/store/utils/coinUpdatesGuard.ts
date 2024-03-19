type Callback = () => boolean

export default function shouldUpdate(isVisibleCallback: Callback) {
  if (window.location.pathname === '/options/wallets') {
    return true
  }

  return isVisibleCallback()
}
