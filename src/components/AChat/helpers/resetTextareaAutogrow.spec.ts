import { describe, expect, it } from 'vitest'
import { resetTextareaAutogrow } from './resetTextareaAutogrow'

describe('resetTextareaAutogrow', () => {
  it('removes inline height for single-line value and resets scroll position', () => {
    const root = document.createElement('div')
    const textarea = document.createElement('textarea')

    textarea.value = 'line1'
    textarea.style.height = '120px'
    textarea.scrollTop = 42

    root.appendChild(textarea)

    const wasReset = resetTextareaAutogrow(root)

    expect(wasReset).toBe(true)
    expect(textarea.style.height).toBe('')
    expect(textarea.scrollTop).toBe(0)
  })

  it('keeps inline height synced for multiline value', () => {
    const root = document.createElement('div')
    const textarea = document.createElement('textarea')

    textarea.value = 'line1\nline2'
    textarea.style.height = '120px'
    textarea.scrollTop = 42

    root.appendChild(textarea)

    const wasReset = resetTextareaAutogrow(root)

    expect(wasReset).toBe(true)
    expect(textarea.style.height).toBe(`${textarea.scrollHeight}px`)
    expect(textarea.scrollTop).toBe(0)
  })

  it('returns false when textarea is absent', () => {
    const root = document.createElement('div')

    const wasReset = resetTextareaAutogrow(root)

    expect(wasReset).toBe(false)
  })
})
