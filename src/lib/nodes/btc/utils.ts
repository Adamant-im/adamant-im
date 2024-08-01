import { BtcTransaction } from '@/lib/nodes/types/transaction'
import { Transaction } from './types/api/common/transaction'

export const MULTIPLIER = 1e8

export function normalizeTransaction(
  tx: Transaction,
  ownerAddress: string,
  currentHeight?: number
): BtcTransaction {
  const senders = tx.vin.map((vin) => vin.prevout.scriptpubkey_address)
  const recipients = tx.vout.map((vout) => vout.scriptpubkey_address)

  const direction = senders.includes(ownerAddress) ? 'from' : 'to'

  if (direction === 'from') {
    // Disregard our address for an outgoing transaction unless it's the only address (i.e. we're sending to ourselves)
    const idx = recipients.indexOf(ownerAddress)
    if (idx >= 0 && recipients.length > 1) recipients.splice(idx, 1)
  }

  if (direction === 'to' && senders.length === 1) {
    // Disregard the only sender address for an incoming transaction unless it's the only address (i.e. we're sending to ourselves)
    const idx = recipients.indexOf(senders[0])
    if (idx >= 0 && recipients.length > 1) recipients.splice(idx, 1)
  }

  const senderId = direction === 'from' ? ownerAddress : senders[0]
  const recipientId = direction === 'to' ? ownerAddress : recipients[0]

  // Calculate amount from outputs:
  // * for the outgoing transactions take outputs that DO NOT target us
  // * for the incoming transactions take outputs that DO target us
  const amount = tx.vout.reduce(
    (sum, t) =>
      (direction === 'to') === (t.scriptpubkey_address === ownerAddress)
        ? sum + Number(t.value)
        : sum,
    0
  )

  const confirmations = currentHeight
    ? currentHeight - tx.status.block_height + 1
    : tx.status.confirmed
      ? 1
      : 0
  const timestamp = tx.status.block_time * 1000

  let fee = tx.fee
  if (!fee) {
    const totalIn = tx.vin.reduce((sum, x) => sum + (x.value ? +x.value : 0), 0)
    const totalOut = tx.vout.reduce((sum, x) => sum + (x.value ? +x.value : 0), 0)
    fee = totalIn - totalOut
  }

  return {
    id: tx.txid,
    hash: tx.txid,
    fee: fee / MULTIPLIER,
    status: confirmations > 0 ? 'CONFIRMED' : 'REGISTERED',
    time: tx.status.block_time,
    timestamp,
    direction,
    senders,
    senderId,
    recipients,
    recipientId,
    amount: amount / MULTIPLIER,
    confirmations,
    height: tx.status.block_height
  }
}
