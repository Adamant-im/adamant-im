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
 * @param {Array<FileData>} files
 * @param {Array<[string, string]>} [nonces] First element is the nonce of original file, second is nonce of preview
 * @param {Array<[string, string]>} [ids] List of files IDs after uploading to IPFS. First element is the ID of original file, second is ID of preview.
 * @param {string} [comment]
 */
export function attachmentAsset(files, nonces, ids, comment) {
  return {
    files: files.map(({ file, width, height, cid, preview }, index) => {
      const [name, extension] = file.name.split('.')
      const resolution = width && height ? [width, height] : undefined
      const [nonce, previewNonce] = nonces?.[index] || []
      const [id, previewId] = cid ? [cid, preview?.cid] : ids?.[index] || []

      return {
        mimeType: file.type,
        name,
        extension,
        resolution,
        duration: undefined, // @todo check if is a video or audio file
        size: file.size,
        id,
        nonce,
        preview: {
          id: previewId,
          nonce: previewNonce,
          extension
        }
      }
    }),
    comment,
    storage: { id: 'ipfs' }
  }
}
