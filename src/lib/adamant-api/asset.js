export function cryptoTransferAsset({ cryptoSymbol, amount, hash, comments, text_fallback }) {
  const asset = {
    type: `${cryptoSymbol.toLowerCase()}_transaction`,
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
