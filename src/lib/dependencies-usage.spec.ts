import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import emojiData from '@emoji-mart/data'
import { v4 as uuidv4 } from 'uuid'

import eslintConfig from '../../eslint.config'

type EmojiMartData = {
  emojis: Record<
    string,
    {
      skins?: Array<{
        native?: string
      }>
    }
  >
}

describe('major-updated dependency usage', () => {
  it('@emoji-mart/data is a typed data package and matches public emoji asset', () => {
    const packageData = emojiData as EmojiMartData
    const publicEmojiDataPath = path.resolve(process.cwd(), 'public/emojis/data.json')
    const publicData = JSON.parse(readFileSync(publicEmojiDataPath, 'utf8')) as EmojiMartData

    const sharedEmojiId = Object.keys(packageData.emojis).find((id) =>
      Boolean(publicData.emojis[id])
    )

    expect(sharedEmojiId).toBeTruthy()
    expect(packageData.emojis[sharedEmojiId!].skins?.[0]?.native).toBeTruthy()
    expect(publicData.emojis[sharedEmojiId!].skins?.[0]?.native).toBe(
      packageData.emojis[sharedEmojiId!].skins?.[0]?.native
    )
  })

  it('uuid generates RFC4122-like ids (used in AChat test message mocks)', () => {
    const first = uuidv4()
    const second = uuidv4()

    const uuidV4LikePattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    expect(first).toMatch(uuidV4LikePattern)
    expect(second).toMatch(uuidV4LikePattern)
    expect(first).not.toBe(second)
  })

  it('globals package is used in eslint flat config for browser and node contexts', () => {
    const typedConfig = eslintConfig as Array<{
      files?: string[]
      languageOptions?: {
        globals?: Record<string, unknown>
      }
    }>
    const targetEntry = typedConfig.find(
      (entry) => Array.isArray(entry.files) && entry.files.includes('**/*.{ts,tsx,js,jsx,vue}')
    )
    const configuredGlobals = targetEntry?.languageOptions?.globals

    expect(configuredGlobals).toBeTruthy()
    expect(configuredGlobals).toHaveProperty('window')
    expect(configuredGlobals).toHaveProperty('process')
  })

  it('jsdom test environment provides browser-like document and window', () => {
    const element = document.createElement('p')
    element.id = 'emoji'
    element.textContent = '🙂'
    document.body.appendChild(element)

    const text = window.document.querySelector('#emoji')?.textContent
    expect(text).toBe('🙂')
  })
})
