// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
const localeNames = ['de', 'en', 'ru', 'zh']
const safeHtmlConsumers = new Map([
  ['login.new_passphrase_label', 'src/components/PassphraseGenerator.vue'],
  ['nodes.nodeLabelDescription', 'src/components/nodes/NodesTable.vue'],
  ['scan.no_stream_details', 'src/components/QrcodeScannerDialog.vue'],
  ['transfer.confirm_message', 'src/components/SendFundsForm.vue'],
  ['transfer.confirm_message_with_name', 'src/components/SendFundsForm.vue'],
  ['votes.stake_info', 'src/views/Votes.vue'],
  ['votes.summary_info', 'src/views/Votes.vue']
])

function collectHtmlMessagePaths(value: unknown, parentPath: string[] = []): string[] {
  if (typeof value === 'string') {
    return /<\/?[a-z][^>]*>/i.test(value) ? [parentPath.join('.')] : []
  }

  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, child]) =>
    collectHtmlMessagePaths(child, [...parentPath, key])
  )
}

describe('i18n HTML rendering contract', () => {
  it.each(localeNames)(
    'allows HTML in %s only for messages rendered through SafeHtml',
    (locale) => {
      const messages = JSON.parse(
        readFileSync(path.join(projectRoot, `src/locales/${locale}.json`), 'utf8')
      ) as unknown
      const htmlMessagePaths = collectHtmlMessagePaths(messages)

      htmlMessagePaths.forEach((messagePath) => {
        const consumerPath = safeHtmlConsumers.get(messagePath)
        expect(consumerPath, `${locale}:${messagePath} has no SafeHtml consumer`).toBeTruthy()

        const source = readFileSync(path.join(projectRoot, consumerPath!), 'utf8')
        expect(source).toContain(messagePath)
        expect(source).toMatch(/(?:import|components:)[\s\S]*SafeHtml/)
      })
    }
  )
})
