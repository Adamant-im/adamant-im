import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const chatToolbarPath = path.resolve(currentDir, '../../components/Chat/ChatToolbar.vue')
const chatsPath = path.resolve(currentDir, '../../components/Chat/Chats.vue')
const chatPreviewPath = path.resolve(currentDir, '../../components/ChatPreview.vue')

describe('Chats UI style contract', () => {
  it('uses tokenized toolbar typography, spacing and floating label transforms', () => {
    const content = readFileSync(chatToolbarPath, 'utf8')

    expect(content).toContain('--a-chat-toolbar-adm-name-letter-spacing')
    expect(content).toContain('--a-chat-toolbar-label-font-size')
    expect(content).toContain('--a-chat-toolbar-input-padding-top')
    expect(content).toContain('--a-chat-toolbar-input-font-weight')
    expect(content).toContain('--a-chat-toolbar-floating-label-font-size')
    expect(content).toContain('--a-chat-toolbar-floating-label-offset-y')
    expect(content).toContain('--a-chat-toolbar-floating-label-scale')
    expect(content).toContain('translateY(var(--a-chat-toolbar-floating-label-offset-y))')
    expect(content).toContain('scale(var(--a-chat-toolbar-floating-label-scale))')

    expect(content).not.toMatch(/(^|\n)\s*letter-spacing:\s*0\.02em;/)
    expect(content).not.toMatch(/(^|\n)\s*font-size:\s*var\(--a-space-5\);/)
    expect(content).not.toMatch(/(^|\n)\s*font-weight:\s*500;/)
  })

  it('keeps chats list action row sizing tokenized', () => {
    const content = readFileSync(chatsPath, 'utf8')

    expect(content).toContain('--a-chats-actions-height')
    expect(content).toContain('--a-chats-actions-padding-inline-start')
    expect(content).toContain('--a-chats-actions-padding-inline-end')
    expect(content).toContain('--a-chats-actions-gap')
    expect(content).toContain('height: var(--a-chats-actions-height);')
    expect(content).toContain('column-gap: var(--a-chats-actions-gap);')

    expect(content).not.toContain('height: 56px;')
  })

  it('keeps chat preview spacing, line-height and icon sizes tokenized', () => {
    const content = readFileSync(chatPreviewPath, 'utf8')

    expect(content).toContain('CHAT_PREVIEW_AVATAR_SIZE')
    expect(content).toContain('CHAT_PREVIEW_STATUS_ICON_SIZE')
    expect(content).toContain('--a-chat-brief-avatar-gap')
    expect(content).toContain('--a-chat-brief-date-gap')
    expect(content).toContain('--a-chat-brief-subtitle-line-height')
    expect(content).toContain('--a-chat-brief-loading-separator-shift')
    expect(content).toContain('--a-chat-brief-loading-separator-duration')
    expect(content).toContain('--a-chat-brief-icon-fill-light')
    expect(content).toContain('line-height: var(--a-chat-brief-subtitle-line-height);')

    expect(content).not.toContain('size="15"')
    expect(content).not.toMatch(/&__subtitle\s*\{[^}]*line-height:\s*1\.5;/s)
    expect(content).not.toContain('fill: #bdbdbd;')
  })
})
