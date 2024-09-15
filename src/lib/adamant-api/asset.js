import { MessageType } from '@/lib/constants'

export function cryptoTransferAsset({ cryptoSymbol, amount, hash, comments, text_fallback }) {
  const asset = {
    type: MessageType.cryptoTransferMessage(cryptoSymbol),
    amount,
    hash,
    comments
  }

  if (text_fallback) {
    asset.text_fallback = text_fallback
  }

  return asset
}

export function replyMessageAsset({ replyToId, replyMessage }) {
  return {
    replyto_id: replyToId,
    reply_message: replyMessage
  }
}

export function replyWithCryptoTransferAsset(replyToId, transferPayload) {
  return {
    replyto_id: replyToId,
    reply_message: cryptoTransferAsset(transferPayload)
  }
}

export function reactionAsset(reactToId, reactMessage) {
  return {
    reactto_id: reactToId,
    react_message: reactMessage
  }
}

/**
 * AIP-18: https://github.com/Adamant-im/AIPs/pull/54/files
 * @param {Array<File>} files
 * @param {string} comment
 */
export function attachmentAsset(files, comment) {
  return {
    files: files.map((file) => ({
      mimeType: file.type,
      name: file.name,
      extension: file.name.split('.').pop(),
      // resolution?: [number, number] // @todo
      // duration?: number // @todo
      id: '',
      size: file.size,
      nonce: '',
      preview: {
        id: '',
        nonce: '',
        extension: ''
      }
    })),
    comment,
    storage: { id: 'ipfs' }
  }
}
