export const pattern = /^(.*)$/gm
export const replace = '<p>$1</p>'

export default function (text) {
  return text.replace(pattern, replace)
}
