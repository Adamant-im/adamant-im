export default function escapeHtml (string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '=': '&#x3D;'
  }

  return String(string).replace(/[&<>"'=]/g, (s) => {
    return entityMap[s]
  })
}
