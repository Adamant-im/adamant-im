import { describe, expect, it, vi } from 'vitest'
import { DashClient } from './DashClient'
import { TransactionNotFound } from '../utils/errors'

describe('DashClient', () => {
  it('maps missing transactions to TransactionNotFound in getTransaction', async () => {
    const client = new DashClient([])

    vi.spyOn(client, 'invoke').mockRejectedValueOnce(
      new Error(
        'No such mempool or blockchain transaction. Use gettransaction for wallet transactions.'
      )
    )

    await expect(client.getTransaction('dash-tx-id', 'XdashAddress')).rejects.toEqual(
      new TransactionNotFound('dash-tx-id', 'dash')
    )
  })

  it('maps missing transactions to TransactionNotFound in getTransactionHex', async () => {
    const client = new DashClient([])

    vi.spyOn(client, 'invoke').mockRejectedValueOnce(new Error('Transaction not found'))

    await expect(client.getTransactionHex('dash-tx-id')).rejects.toEqual(
      new TransactionNotFound('dash-tx-id', 'dash')
    )
  })

  it('maps RPC 500 not-found payloads to TransactionNotFound', async () => {
    const client = new DashClient([])

    vi.spyOn(client, 'invoke').mockRejectedValueOnce({
      response: {
        status: 500,
        data: {
          error: {
            message:
              'No such mempool or blockchain transaction. Use gettransaction for wallet transactions.'
          }
        }
      }
    })

    await expect(client.getTransaction('dash-tx-id', 'XdashAddress')).rejects.toEqual(
      new TransactionNotFound('dash-tx-id', 'dash')
    )
  })
})
