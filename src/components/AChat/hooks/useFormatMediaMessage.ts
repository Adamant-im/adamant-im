import { NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'
import { h } from 'vue'

const cameraEmoji = '📸'
const paperEmoji = '📄'

export function useFormatMediaMessage(transaction: NormalizedChatMessageTransaction) {
  const files = transaction.asset.files
  const filesCount = files.length

  const imageAndVideoCount = files.filter(
    (file: FileAsset) => file.mimeType?.startsWith('image') || file.mimeType?.startsWith('video')
  ).length

  const restMediaCount = filesCount - imageAndVideoCount

  const parts: any[] = []

  if (imageAndVideoCount > 0) {
    parts.push(() =>
      h('span', null, [
        cameraEmoji,
        h('sub', { style: 'font-size:0.7em;' }, imageAndVideoCount.toString())
      ])
    )
  }

  if (restMediaCount > 0) {
    parts.push(() =>
      h('span', null, [
        paperEmoji,
        h('sub', { style: 'font-size:0.7em;' }, restMediaCount.toString())
      ])
    )
  }

  if (transaction.message) {
    parts.push(() => h('span', null, transaction.message))
  }

  return parts
}
