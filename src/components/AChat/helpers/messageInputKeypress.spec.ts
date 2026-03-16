import { describe, expect, it } from 'vitest'
import { getMessageSubmitAction } from './messageInputKeypress'

describe('getMessageSubmitAction', () => {
  it('returns none for non-enter keys', () => {
    expect(
      getMessageSubmitAction({
        keyCode: 65,
        sendOnEnter: true,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false
      })
    ).toBe('none')
  })

  it('returns send for Enter when sendOnEnter is enabled', () => {
    expect(
      getMessageSubmitAction({
        keyCode: 13,
        sendOnEnter: true,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false
      })
    ).toBe('send')
  })

  it('returns linefeed for modified Enter when sendOnEnter is enabled', () => {
    expect(
      getMessageSubmitAction({
        keyCode: 13,
        sendOnEnter: true,
        ctrlKey: true,
        altKey: false,
        metaKey: false,
        shiftKey: false
      })
    ).toBe('linefeed')
  })

  it('returns none for Shift+Enter when sendOnEnter is enabled', () => {
    expect(
      getMessageSubmitAction({
        keyCode: 13,
        sendOnEnter: true,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: true
      })
    ).toBe('none')
  })

  it('returns send for modified Enter when sendOnEnter is disabled', () => {
    expect(
      getMessageSubmitAction({
        keyCode: 13,
        sendOnEnter: false,
        ctrlKey: false,
        altKey: true,
        metaKey: false,
        shiftKey: false
      })
    ).toBe('send')
  })

  it('returns none for plain Enter when sendOnEnter is disabled', () => {
    expect(
      getMessageSubmitAction({
        keyCode: 13,
        sendOnEnter: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false
      })
    ).toBe('none')
  })

  it('supports keyCode 10 as Enter', () => {
    expect(
      getMessageSubmitAction({
        keyCode: 10,
        sendOnEnter: true,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false
      })
    ).toBe('send')
  })
})
