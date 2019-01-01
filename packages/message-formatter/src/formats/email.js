export const pattern = /(\w+@\S+\.\w+)/gi
export const replace = '<a href="mailto:$1">$1</a>'

export default function (text) {
  return text.replace(pattern, replace)
}
