export const pattern = /(^|\s)(eth|bch|bitcoin|https?|s?ftp|magnet|tor|onion|tg):(.*)($|\s)/gmi
export const replace = '<a href="$2:$3">$2:$3</a>'

export default function (text) {
  return text.replace(pattern, replace)
}
