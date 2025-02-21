type Callback = () => boolean

export default function shouldUpdate(isVisibleCallback: Callback) {
  if (window.location.pathname === '/options/wallets') {
    return true
  }

  const isVisible = isVisibleCallback()

  if (isVisible === undefined) {
    return true;
  }

  return isVisible
}
