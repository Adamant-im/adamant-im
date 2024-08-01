import { DashTransaction } from '@/lib/nodes/types/transaction'
import { Transaction } from './types/api/transaction'

function onlyUnique<V>(value: V, index: number, array: V[]) {
  return array.indexOf(value) === index
}

export function normalizeTransaction(tx: Transaction, ownerAddress: string): DashTransaction {
  const senders = tx.vin.map((vin) => vin.address)
  const recipients = tx.vout.flatMap((vout) => vout.scriptPubKey.addresses).filter(onlyUnique)

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
      (direction === 'to') === t.scriptPubKey.addresses.includes(ownerAddress)
        ? sum + Number(t.value)
        : sum,
    0
  )

  const confirmations = tx.confirmations
  const timestamp = tx.time * 1000

  const totalIn = tx.vin.reduce((sum, x) => sum + (x.value ? +x.value : 0), 0)
  const totalOut = tx.vout.reduce((sum, x) => sum + (x.value ? +x.value : 0), 0)
  const fee = totalIn - totalOut

  const height = tx.height

  return {
    id: tx.txid,
    hash: tx.txid,
    fee,
    status: confirmations > 0 ? 'CONFIRMED' : 'REGISTERED',
    time: tx.time,
    timestamp,
    direction,
    senders,
    senderId,
    recipients,
    recipientId,
    amount,
    confirmations,
    height
  }
}
