export const pattern = /```([^`]+)```/g
export const replace = '<pre>$1</pre>'

export default function (text) {
  return text.replace(pattern, replace)
}
