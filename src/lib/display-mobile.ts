export function isMobile() {
  const displayMobile =
    window.innerWidth < 450 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  return displayMobile
}
