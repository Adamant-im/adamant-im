import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { io } = vi.hoisted(() => ({ io: vi.fn() }))

vi.mock('socket.io-client', () => ({ io }))

const { SocketClient } = await import('../sockets')

describe('SocketClient subscriptions', () => {
  let connection
  let handlers

  beforeEach(() => {
    handlers = {}
    connection = {
      on: vi.fn((event, handler) => {
        handlers[event] = handler
      }),
      emit: vi.fn(),
      close: vi.fn()
    }
    io.mockReset().mockReturnValue(connection)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('subscribes to chat messages and direct ADM transfers for the active address', () => {
    const client = new SocketClient()
    const node = { socketAddress: 'wss://node.example' }

    client.setAdamantAddress('U123456')
    client.connect(node)
    handlers.connect()

    expect(connection.emit.mock.calls).toEqual([
      ['address', 'U123456'],
      ['types', [0, 8]]
    ])
  })

  it('connects immediately when initialized with an active node', () => {
    vi.useFakeTimers()

    const client = new SocketClient()
    client.setNodes([
      {
        hostname: 'node.example',
        wsProtocol: 'wss:',
        wsPortNeeded: false,
        online: true,
        active: true,
        outOfSync: false,
        socketSupport: true,
        hasMinNodeVersion: true,
        hasSupportedProtocol: true
      }
    ])
    client.setSocketEnabled(true)

    client.init('U123456')

    expect(io).toHaveBeenCalledWith('wss://node.example', {
      reconnection: false,
      timeout: 5000
    })

    client.destroy()
  })
})
