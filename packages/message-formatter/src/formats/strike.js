export const pattern = /~([^~]+)~/g
export const replace = '<strike>$1</strike>'

export default function (text) {
  return text.replace(pattern, replace)
}
