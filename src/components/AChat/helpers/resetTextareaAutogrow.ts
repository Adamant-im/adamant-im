export const resetTextareaAutogrow = (root?: ParentNode | null) => {
  const textarea = root?.querySelector('textarea')

  if (!(textarea instanceof HTMLTextAreaElement)) {
    return false
  }

  const textareaField = textarea.closest('.v-field')
  const lineCount = textarea.value.split('\n').length

  // Reset auto-grow inline height so an emptied multiline input collapses back to one row
  textarea.style.height = 'auto'
  // On mobile, sub-pixel rounding in Vuetify can flip 32<->33px after edits.
  // Keep control height explicit and stable to avoid visible "jump".
  const controlHeight = Math.ceil(textarea.scrollHeight + 1)

  if (lineCount <= 1) {
    // Let single-line inputs use default CSS height (prevents stale multiline inline height)
    textarea.style.removeProperty('height')
  } else {
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  if (textareaField instanceof HTMLElement) {
    textareaField.style.setProperty('--v-textarea-control-height', `${controlHeight}px`)
  }

  textarea.scrollTop = 0

  return true
}
