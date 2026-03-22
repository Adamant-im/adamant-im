import { describe, it, expect } from 'vitest'
import { normalizeTransaction } from './utils'
import { Transaction } from './types/api/transaction'

describe('normalizeTransaction', () => {
  const OWNER_ADDRESS = 'XqPCbp7S5pVPdqVqH3L7D3vUqC8t9xYPZg'
  const OTHER_ADDRESS = 'XmNwxKvKYqLkQzQvY8xJnBvZ6FwPzXqVaL'

  // Transaction with duplicate senders (multiple inputs from same address)
  const txWithDuplicateSenders: Transaction = {
    txid: 'dash_tx_duplicate_senders',
    version: 1,
    type: 0,
    size: 250,
    locktime: 0,
    vin: [
      // Two inputs from the same address (owner used two UTXOs)
      {
        address: OWNER_ADDRESS,
        value: 1000,
        valueSat: 1000,
        txid: 'prev1',
        vout: 0,
        scriptSig: { asm: '', hex: '' },
        sequence: 0
      },
      {
        address: OWNER_ADDRESS,
        value: 91629,
        valueSat: 91629,
        txid: 'prev2',
        vout: 1,
        scriptSig: { asm: '', hex: '' },
        sequence: 0
      }
    ],
    vout: [
      // First output: actual transfer to another address
      {
        value: 600,
        valueSat: 600,
        scriptPubKey: {
          addresses: [OTHER_ADDRESS],
          asm: 'OP_DUP...',
          hex: '76a914...',
          reqSigs: 1,
          type: 'pubkeyhash'
        },
        n: 0,
        spentTxId: '',
        spentIndex: 0,
        spentHeight: 0
      },
      // Second output: change back to owner
      {
        value: 91534,
        valueSat: 91534,
        scriptPubKey: {
          addresses: [OWNER_ADDRESS],
          asm: 'OP_DUP...',
          hex: '76a914...',
          reqSigs: 1,
          type: 'pubkeyhash'
        },
        n: 1,
        spentTxId: '',
        spentIndex: 0,
        spentHeight: 0
      }
    ],
    hex: '0100000002...',
    blockhash: '00000000000000000001...',
    height: 2100000,
    confirmations: 100,
    time: 1753953340,
    blocktime: 1753953340,
    instantlock: false,
    instantlock_internal: false,
    chainlock: false
  }

  // Self-transfer transaction (sending to own address)
  const txSelfTransfer: Transaction = {
    txid: 'dash_tx_self_transfer',
    version: 1,
    type: 0,
    size: 220,
    locktime: 0,
    vin: [
      {
        address: OWNER_ADDRESS,
        value: 96781,
        valueSat: 96781,
        txid: 'prev3',
        vout: 0,
        scriptSig: { asm: '', hex: '' },
        sequence: 0
      }
    ],
    vout: [
      // First output: actual transfer amount
      {
        value: 1000,
        valueSat: 1000,
        scriptPubKey: {
          addresses: [OWNER_ADDRESS],
          asm: 'OP_DUP...',
          hex: '76a914...',
          reqSigs: 1,
          type: 'pubkeyhash'
        },
        n: 0,
        spentTxId: '',
        spentIndex: 0,
        spentHeight: 0
      },
      // Second output: change
      {
        value: 94963,
        valueSat: 94963,
        scriptPubKey: {
          addresses: [OWNER_ADDRESS],
          asm: 'OP_DUP...',
          hex: '76a914...',
          reqSigs: 1,
          type: 'pubkeyhash'
        },
        n: 1,
        spentTxId: '',
        spentIndex: 0,
        spentHeight: 0
      }
    ],
    hex: '0100000001...',
    blockhash: '00000000000000000002...',
    height: 2099000,
    confirmations: 1100,
    time: 1753900000,
    blocktime: 1753900000,
    instantlock: false,
    instantlock_internal: false,
    chainlock: false
  }

  it('should remove duplicate senders and display transaction correctly', () => {
    const result = normalizeTransaction(txWithDuplicateSenders, OWNER_ADDRESS)

    // Assert: senders array should contain only unique addresses
    expect(result.senders).toEqual([OWNER_ADDRESS])
    expect(result.senders).toHaveLength(1)

    // Assert: direction should be 'from' (outgoing)
    expect(result.direction).toBe('from')

    // Assert: senderId should be owner, recipientId should be OTHER_ADDRESS
    expect(result.senderId).toBe(OWNER_ADDRESS)
    expect(result.recipientId).toBe(OTHER_ADDRESS)

    // Assert: recipients should only contain actual recipient (change filtered out)
    expect(result.recipients).toEqual([OTHER_ADDRESS])

    // Assert: amount should be 600 (actual transfer)
    expect(result.amount).toBe(600)
  })

  it('should calculate correct amount for self-transfer (fix for incorrect amount bug)', () => {
    const result = normalizeTransaction(txSelfTransfer, OWNER_ADDRESS)

    // Assert: correctly identified as self-transfer
    expect(result.senders).toEqual([OWNER_ADDRESS])
    expect(result.recipients).toEqual([OWNER_ADDRESS])

    // Assert: both sender and recipient are owner
    expect(result.senderId).toBe(OWNER_ADDRESS)
    expect(result.recipientId).toBe(OWNER_ADDRESS)

    // Assert: direction is outgoing (even though sending to self)
    expect(result.direction).toBe('from')

    // Assert: amount should be first output (1000)
    expect(result.amount).toBe(1000)
  })

  it('should calculate fee without floating-point drift', () => {
    const result = normalizeTransaction(
      {
        ...txSelfTransfer,
        vin: [
          {
            ...txSelfTransfer.vin[0],
            value: 0.0014
          }
        ],
        vout: [
          {
            ...txSelfTransfer.vout[0],
            value: 0.0013
          }
        ]
      },
      OWNER_ADDRESS
    )

    expect(result.fee).toBe(0.0001)
  })
})
