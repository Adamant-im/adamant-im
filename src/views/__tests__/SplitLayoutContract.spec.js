import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const layoutVariablesPath = path.resolve(currentDir, '../../assets/styles/generic/_variables.scss')
const layoutScssPath = path.resolve(currentDir, '../../assets/styles/generic/_layout.scss')
const appSidebarPath = path.resolve(currentDir, '../AppSidebar.vue')
const chatsPath = path.resolve(currentDir, '../../components/Chat/Chats.vue')

describe('Split layout style contract', () => {
  it('defines safe fallback for layout height variables', () => {
    const content = readFileSync(layoutVariablesPath, 'utf8')

    expect(content).toContain('--a-layout-bottom: 0px;')
    expect(content).toContain('--a-layout-height: calc(100vh - var(--a-layout-bottom));')
    expect(content).toContain('100vh - var(--a-layout-bottom) - var(--a-safe-area-bottom)')
  })

  it('maps layout height variables to vuetify layout context', () => {
    const content = readFileSync(layoutScssPath, 'utf8')

    expect(content).toContain('.v-main,')
    expect(content).toContain('--a-layout-bottom: var(--v-layout-bottom, 0px);')
    expect(content).toContain('--a-layout-height: calc(100vh - var(--a-layout-bottom));')
  })

  it('defines a shared split-pane scroll utility', () => {
    const content = readFileSync(layoutScssPath, 'utf8')

    expect(content).toContain('.a-scroll-pane')
    expect(content).toContain('overflow-y: auto;')
    expect(content).toContain('overflow-x: hidden;')
    expect(content).toContain('overscroll-behavior: contain;')
  })

  it('keeps sidebar pane bound to shared layout height tokens and utility class', () => {
    const content = readFileSync(appSidebarPath, 'utf8')

    expect(content).toContain('height: var(--a-layout-height);')
    expect(content).toContain('height: var(--a-layout-height-safe);')
    expect(content).toContain("'a-scroll-pane'")
  })

  it('uses shared split-pane utility in chats list pane', () => {
    const content = readFileSync(chatsPath, 'utf8')

    expect(content).toContain('class="a-scroll-pane"')
  })
})
