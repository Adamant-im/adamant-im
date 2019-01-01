export const pattern = /_([^_]+)_/g
export const replace = '<i>$1</i>'

export default function (text) {
  return text.replace(pattern, replace)
}
