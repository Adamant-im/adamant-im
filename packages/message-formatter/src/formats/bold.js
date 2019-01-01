export const pattern = /\*([^*]+)\*/g
export const replace = '<strong>$1</strong>'

export default function (text) {
  return text.replace(pattern, replace)
}
