/**
 * Normalize the height to 8 digits.
 * Rounds the timestamp to seconds and removes the first two digits.
 * @param timestamp Timestamp in milliseconds
 */
export const normalizeHeight = (timestamp: number) => {
  if (!timestamp) return 0

  return Number(
    Math.ceil(timestamp / 1000)
      .toString()
      .substring(2)
  )
}
