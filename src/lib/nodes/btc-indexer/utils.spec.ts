import { describe, it, expect } from 'vitest'
import { normalizeTransaction } from './utils'
import { Transaction } from './types/api/common/transaction'

describe('normalizeTransaction', () => {
  const OWNER_ADDRESS = '1EQuRM9nKdzUFUadUXKcaHQCeMR5eGsWwP'
  const OTHER_ADDRESS = '18Yva8fgQyMxsSfYHpM2wqSnft814tPZxg'
  const CURRENT_HEIGHT = 908000

  // Transaction 795190ac... - Outgoing transaction with 2 inputs from same address
  const txWithDuplicateSenders: Transaction = {
    txid: '795190ac15ab1c402fd9dd117e41a2fee8c38b2b1c720fca1b73582d19595393',
    version: 1,
    locktime: 0,
    vin: [
      // Two inputs from the same address (owner used two UTXOs to cover amount + fee)
      {
        txid: 'd9dc71624543a28df63c2a10455f3b35fe78b4f4fb9a8ba271a07e750019b572',
        vout: 0,
        prevout: {
          scriptpubkey: '76a914931ef5cbdad28723ba9596de5da1145ae969a71888ac',
          scriptpubkey_asm:
            'OP_DUP OP_HASH160 OP_PUSHBYTES_20 931ef5cbdad28723ba9596de5da1145ae969a718 OP_EQUALVERIFY OP_CHECKSIG',
          scriptpubkey_type: 'p2pkh',
          scriptpubkey_address: OWNER_ADDRESS,
          value: 1000
        },
        scriptsig:
          '473044022072f0797af905850aafed958e30d15fd3d9a3f76fd1db750b1b6059adf9355d1c0220383ebf2e39b66309e3342ce168386df6d9f020be4e7ec4de09c8ed98743525140121037ec9f6126013088b3d1e8f844f3e755144756a4e9a7da6b0094c189f55031934',
        scriptsig_asm:
          'OP_PUSHBYTES_71 3044022072f0797af905850aafed958e30d15fd3d9a3f76fd1db750b1b6059adf9355d1c0220383ebf2e39b66309e3342ce168386df6d9f020be4e7ec4de09c8ed987435251401 OP_PUSHBYTES_33 037ec9f6126013088b3d1e8f844f3e755144756a4e9a7da6b0094c189f55031934',
        is_coinbase: false,
        sequence: 4294967295
      },
      {
        txid: '596b8c51880a09d352d1c30cae7f6948db23fafdd3cb264b95ec5c35e6202dc7',
        vout: 1,
        prevout: {
          scriptpubkey: '76a914931ef5cbdad28723ba9596de5da1145ae969a71888ac',
          scriptpubkey_asm:
            'OP_DUP OP_HASH160 OP_PUSHBYTES_20 931ef5cbdad28723ba9596de5da1145ae969a718 OP_EQUALVERIFY OP_CHECKSIG',
          scriptpubkey_type: 'p2pkh',
          scriptpubkey_address: OWNER_ADDRESS,
          value: 91629
        },
        scriptsig:
          '483045022100d7e49c6656a8800d88664e0bf1611fadbe78add6bcb0a53fc2798775eead137d02206cd72545c51e4fdd141af5f823081a9f813f401fea88b78ac1b9020bbc86e03d0121037ec9f6126013088b3d1e8f844f3e755144756a4e9a7da6b0094c189f55031934',
        scriptsig_asm:
          'OP_PUSHBYTES_72 3045022100d7e49c6656a8800d88664e0bf1611fadbe78add6bcb0a53fc2798775eead137d02206cd72545c51e4fdd141af5f823081a9f813f401fea88b78ac1b9020bbc86e03d01 OP_PUSHBYTES_33 037ec9f6126013088b3d1e8f844f3e755144756a4e9a7da6b0094c189f55031934',
        is_coinbase: false,
        sequence: 4294967295
      }
    ],
    vout: [
      // First output: actual transfer to another address
      {
        scriptpubkey: '76a91452d27e8c1351dc928648968ba44c723fa402578788ac',
        scriptpubkey_asm:
          'OP_DUP OP_HASH160 OP_PUSHBYTES_20 52d27e8c1351dc928648968ba44c723fa4025787 OP_EQUALVERIFY OP_CHECKSIG',
        scriptpubkey_type: 'p2pkh',
        scriptpubkey_address: OTHER_ADDRESS,
        value: 600
      },
      // Second output: change back to owner
      {
        scriptpubkey: '76a914931ef5cbdad28723ba9596de5da1145ae969a71888ac',
        scriptpubkey_asm:
          'OP_DUP OP_HASH160 OP_PUSHBYTES_20 931ef5cbdad28723ba9596de5da1145ae969a718 OP_EQUALVERIFY OP_CHECKSIG',
        scriptpubkey_type: 'p2pkh',
        scriptpubkey_address: OWNER_ADDRESS,
        value: 91534
      }
    ],
    size: 373,
    weight: 1492,
    fee: 495,
    status: {
      confirmed: true,
      block_height: 907930,
      block_hash: '0000000000000000000154792351118ab482e8b3880e9c30779ec444a9f3aa54',
      block_time: 1753953340
    }
  }

  // Transaction d9dc7162... - Self-transfer to the same address
  const txSelfTransfer: Transaction = {
    txid: 'd9dc71624543a28df63c2a10455f3b35fe78b4f4fb9a8ba271a07e750019b572',
    version: 1,
    locktime: 0,
    vin: [
      {
        txid: 'cc24dacb04298f5381fd3ee0e742b8c1ce109d1e75f29079404fcf02b29556e7',
        vout: 1,
        prevout: {
          scriptpubkey: '76a914931ef5cbdad28723ba9596de5da1145ae969a71888ac',
          scriptpubkey_asm:
            'OP_DUP OP_HASH160 OP_PUSHBYTES_20 931ef5cbdad28723ba9596de5da1145ae969a718 OP_EQUALVERIFY OP_CHECKSIG',
          scriptpubkey_type: 'p2pkh',
          scriptpubkey_address: OWNER_ADDRESS,
          value: 96781
        },
        scriptsig: '47304402207c3b3...',
        scriptsig_asm: 'OP_PUSHBYTES_71...',
        is_coinbase: false,
        sequence: 4294967295
      }
    ],
    vout: [
      // First output: actual transfer amount (what user entered in "Send" dialog)
      {
        scriptpubkey: '76a914931ef5cbdad28723ba9596de5da1145ae969a71888ac',
        scriptpubkey_asm:
          'OP_DUP OP_HASH160 OP_PUSHBYTES_20 931ef5cbdad28723ba9596de5da1145ae969a718 OP_EQUALVERIFY OP_CHECKSIG',
        scriptpubkey_type: 'p2pkh',
        scriptpubkey_address: OWNER_ADDRESS,
        value: 1000
      },
      // Second output: change (remaining balance after transfer and fee)
      {
        scriptpubkey: '76a914931ef5cbdad28723ba9596de5da1145ae969a71888ac',
        scriptpubkey_asm:
          'OP_DUP OP_HASH160 OP_PUSHBYTES_20 931ef5cbdad28723ba9596de5da1145ae969a718 OP_EQUALVERIFY OP_CHECKSIG',
        scriptpubkey_type: 'p2pkh',
        scriptpubkey_address: OWNER_ADDRESS,
        value: 94963
      }
    ],
    size: 225,
    weight: 900,
    fee: 818,
    status: {
      confirmed: true,
      block_height: 906955,
      block_hash: '00000000000000000001547923511...',
      block_time: 1753900000
    }
  }

  it('should remove duplicate senders and display transaction correctly', () => {
    const result = normalizeTransaction(txWithDuplicateSenders, OWNER_ADDRESS, CURRENT_HEIGHT)

    // Assert: senders array should contain only unique addresses (no duplicates)
    expect(result.senders).toEqual([OWNER_ADDRESS])
    expect(result.senders).toHaveLength(1)

    // Assert: direction should be 'from' (outgoing) since owner is the sender
    expect(result.direction).toBe('from')

    // Assert: senderId should be owner address (we are sending)
    expect(result.senderId).toBe(OWNER_ADDRESS)

    // Assert: recipientId should be OTHER_ADDRESS (recipient, not our change address)
    // normalizeTransaction correctly filters out owner's change address from recipients
    expect(result.recipientId).toBe(OTHER_ADDRESS)

    // Assert: recipients array should only contain the actual recipient (change filtered out)
    expect(result.recipients).toEqual([OTHER_ADDRESS])

    // Assert: amount should be 0.000006 BTC (600 satoshi / 100,000,000)
    // This is the actual transfer amount sent to OTHER_ADDRESS, not the change (91534)
    expect(result.amount).toBe(0.000006)
  })

  it('should calculate correct amount for self-transfer', () => {
    const result = normalizeTransaction(txSelfTransfer, OWNER_ADDRESS, CURRENT_HEIGHT)

    // Assert: This is correctly identified as true self-transfer
    // All senders = owner AND all recipients = owner
    expect(result.senders).toEqual([OWNER_ADDRESS])
    expect(result.recipients).toEqual([OWNER_ADDRESS])

    // Assert: both sender and recipient are owner address (sending to self)
    expect(result.senderId).toBe(OWNER_ADDRESS)
    expect(result.recipientId).toBe(OWNER_ADDRESS)

    // Assert: direction should be 'from' (outgoing, even though sending to self)
    expect(result.direction).toBe('from')

    // Assert: amount should be ONLY first output: 1000 satoshi = 0.00001 BTC
    expect(result.amount).toBe(0.00001)
  })
})
