export const normalizeHeight = (height: number) => {
  if (!height) return 0
  return Number(
    Math.ceil(height / 1000)
      .toString()
      .substring(2)
  )
}
