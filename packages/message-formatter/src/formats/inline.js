export const pattern = /`([^`]+)`/g
export const replace = '<code>$1</code>'

export default function (text) {
  return text.replace(pattern, replace)
}
