import { beforeEach, describe, expect, it, vi } from 'vitest'

const getChatsRequest = vi.fn()

vi.mock('@/lib/adamant-api', () => ({
  getChats: (...args) => getChatsRequest(...args)
}))

const { getChats } = await import('./getChats')

describe('getChats pagination', () => {
  beforeEach(() => {
    getChatsRequest.mockReset()
  })

  it('advances past a page containing only hidden protocol messages', async () => {
    const visibleTransaction = { id: 'visible', height: 11 }

    getChatsRequest
      .mockResolvedValueOnce({
        transactions: [],
        fetchedCount: 1,
        lastProcessedHeight: 10,
        nodeTimestamp: 100
      })
      .mockResolvedValueOnce({
        transactions: [visibleTransaction],
        fetchedCount: 1,
        lastProcessedHeight: 11,
        nodeTimestamp: 101
      })
      .mockResolvedValueOnce({
        transactions: [],
        fetchedCount: 0,
        lastProcessedHeight: 0,
        nodeTimestamp: 102
      })

    await expect(getChats()).resolves.toEqual({
      messages: [visibleTransaction],
      lastMessageHeight: 11,
      nodeTimestamp: 102
    })
    expect(getChatsRequest.mock.calls).toEqual([
      [0, 0, 'asc'],
      [0, 1, 'asc'],
      [0, 2, 'asc']
    ])
  })
})
