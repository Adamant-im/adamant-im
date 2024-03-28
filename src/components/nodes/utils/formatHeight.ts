export function formatHeight(height: number) {
  const formatted = height.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return formatted
}
