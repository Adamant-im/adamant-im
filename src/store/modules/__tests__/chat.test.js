import chatModule from '@/store/modules/chat'
import sinon from 'sinon'

const { getters, mutations, actions } = chatModule

describe('Store: chat.js', () => {
  let state = null

  beforeEach(() => {
    state = chatModule.state()
  })

  /**
   * Test getters.
   */
  describe('getters', () => {
    /**
     * getters.partners
     */
    describe('getters.partners', () => {
      it('should return empty array when no chats', () => {
        state = {
          chats: {}
        }

        expect(getters.partners(state)).toEqual([])
      })

      it('should return array of partners', () => {
        state = {
          chats: {
            U123456: {},
            U654321: {}
          }
        }

        expect(getters.partners(state)).toEqual(['U123456', 'U654321'])
      })
    })

    /**
     * getters.messages
     */
    describe('getters.messages', () => {
      it('should return empty array', () => {
        state = {
          chats: {
            U123456: {
              messages: []
            }
          }
        }

        expect(getters.messages(state)('U123456')).toEqual([])
      })

      it('should return empty array when no user in chat list', () => {
        state = {
          chats: {
            U123456: {
              messages: []
            }
          }
        }

        expect(getters.messages(state)('U654321')).toEqual([])
      })

      it('should return array of messages', () => {
        state = {
          chats: {
            U123456: {
              messages: [{}, {}] // 2 messages
            }
          }
        }

        expect(getters.messages(state)('U123456')).toEqual([{}, {}])
      })
    })

    /**
     * getters.lastMessage
     */
    describe('getters.lastMessage', () => {
      it('should return last message', () => {
        // two messages
        expect(getters.lastMessage({
          chats: {
            U123456: {
              messages: ['msg1', 'msg2']
            }
          }
        }, {
          partners: ['U123456']
        })('U123456')).toBe('msg2')

        // one message
        expect(getters.lastMessage({
          chats: {
            U123456: {
              messages: ['msg1']
            }
          }
        }, {
          partners: ['U123456']
        })('U123456')).toBe('msg1')
      })

      it('should return `null` when no messages', () => {
        const lastMessage = getters.lastMessage({
          chats: {
            U123456: {
              messages: []
            }
          }
        }, {
          partners: ['U123456']
        })('U123456')

        expect(lastMessage).toBe(null)
      })

      it('should return `null` when no partner in chat list', () => {
        const lastMessage = getters.lastMessage({
          chats: {
            U123456: {
              messages: []
            }
          }
        }, {
          partners: ['U654321']
        })('U123456')

        expect(lastMessage).toBe(null)
      })
    })

    /**
     * getters.lastMessageText
     */
    describe('getters.lastMessageText', () => {
      it('should return last message text', () => {
        let lastMessageText = null

        // type `message` or `adm transaction`
        lastMessageText = getters.lastMessageText({}, {
          lastMessage: () => ({
            message: 'hello world'
          })
        })()
        expect(lastMessageText).toBe('hello world')

        // type eth transaction
        lastMessageText = getters.lastMessageText({}, {
          lastMessage: () => ({
            message: {
              type: 'eth_transaction',
              comments: 'eth transaction comment'
            }
          })
        })()
        expect(lastMessageText).toBe('eth transaction comment')
      })

      it('should return empty string', () => {
        let lastMessageText = null

        // when `lastMessage = null`
        lastMessageText = getters.lastMessageText({}, {
          lastMessage: () => null
        })()
        expect(lastMessageText).toBe('')

        // invalid transaction type
        lastMessageText = getters.lastMessageText({}, {
          lastMessage: () => ({
            message: {
              type: 'invalid_type',
              comments: 'transaction comment'
            }
          })
        })()
        expect(lastMessageText).toBe('')
      })
    })

    /**
     * getters.lastMessageTimestamp
     */
    describe('getters.lastMessageTimestamp', () => {
      it('should return timestamp', () => {
        let timestamp = null

        timestamp = getters.lastMessageTimestamp({}, {
          lastMessage: () => ({
            timestamp: 3600
          })
        })()

        expect(timestamp).toBe(3600)
      })

      it('should return empty string when `lastMessage = null`', () => {
        let timestamp = null

        timestamp = getters.lastMessageTimestamp({}, {
          lastMessage: () => null
        })()

        expect(timestamp).toBe('')
      })

      it('should return timestamp when `message.timestamp = 0`', () => {
        let timestamp = null

        timestamp = getters.lastMessageTimestamp({}, {
          lastMessage: () => ({
            timestamp: 0
          })
        })()

        expect(timestamp).toBe(0)
      })
    })

    /**
     * getters.isPartnerInChatList
     */
    describe('getters.isPartnerInChatList', () => {
      it('should return true or false', () => {
        let isPartnerInChatList = null

        isPartnerInChatList = getters.isPartnerInChatList({}, {
          partners: ['U123456', 'U654321']
        })

        expect(isPartnerInChatList('U123456')).toBe(true)
        expect(isPartnerInChatList('notInList')).toBe(false) // user not listed
      })
    })

    /**
     * getters.numOfNewMessages
     */
    describe('getters.numOfNewMessages', () => {
      it('should return number of new messages by senderId', () => {
        let numOfNewMessages = null

        numOfNewMessages = getters.numOfNewMessages({
          chats: {
            U123456: {
              numOfNewMessages: 10
            }
          }
        })

        expect(numOfNewMessages('U123456')).toBe(10)
        expect(numOfNewMessages('U654321')).toBe(0) // user not listed
      })
    })

    /**
     * getters.totalNumOfNewMessages
     */
    describe('getters.totalNumOfNewMessages', () => {
      it('should return total number of new messages', () => {
        let total = null

        total = getters.totalNumOfNewMessages({
          chats: {
            U123456: {
              numOfNewMessages: 10
            },
            U654321: {
              numOfNewMessages: 20
            }
          }
        })

        expect(total).toBe(30)
      })

      it('should return 0 when `chats` is empty', () => {
        let total = null

        total = getters.totalNumOfNewMessages({
          chats: {}
        })

        expect(total).toBe(0)
      })
    })
  })

  /**
   * Test mutations.
   */
  describe('mutations', () => {
    /**
     * mutations.setHeight
     */
    describe('mutations.setHeight', () => {
      it('should mutate `lastMessageHeight`', () => {
        const state = {
          lastMessageHeight: 0
        }

        mutations.setHeight(state, 100)

        expect(state.lastMessageHeight).toBe(100)
      })
    })

    /**
     * mutations.setFulfilled
     */
    describe('mutations.setFulfilled', () => {
      it('should mutate `isFulfilled`', () => {
        const state = {
          isFulfilled: false
        }

        mutations.setFulfilled(state, true)

        expect(state.isFulfilled).toBe(true)
      })
    })

    /**
     * mutations.createEmptyChat
     */
    describe('mutations.createEmptyChat', () => {
      it('should create empty chat', () => {
        const state = {
          chats: {}
        }

        mutations.createEmptyChat(state, 'U123456')

        expect(state.chats).toEqual({
          U123456: {
            messages: [],
            numOfNewMessages: 0
          }
        })
      })
    })

    /**
     * mutations.pushMessage
     */
    describe('mutations.pushMessage', () => {
      it('should push message to specific chat by senderId', () => {
        const state = {
          chats: {
            U111111: {
              messages: []
            },
            U222222: {
              messages: []
            }
          }
        }

        const userId = 'U123456' // my address
        const partnerId = 'U111111'

        // U111111 => me
        mutations.pushMessage(state, {
          message: {
            senderId: partnerId,
            recipientId: userId,
            message: 'hello'
          },
          userId
        })

        // me => U111111
        mutations.pushMessage(state, {
          message: {
            senderId: userId,
            recipientId: partnerId,
            message: 'hi'
          },
          userId
        })

        expect(state.chats.U111111.messages).toEqual([
          {
            senderId: partnerId,
            recipientId: userId,
            message: 'hello'
          },
          {
            senderId: userId,
            recipientId: partnerId,
            message: 'hi'
          }
        ])
      })

      it('should create empty chat if the partner is not in chat list', () => {
        const state = {
          chats: {
            U111111: {
              messages: []
            },
            U222222: {
              messages: []
            }
          }
        }

        const userId = 'U123456' // my address
        const partnerId = 'U333333' // partner is not in chat list

        // me => U333333
        mutations.pushMessage(state, {
          message: {
            senderId: userId,
            recipientId: partnerId,
            message: 'hello'
          },
          userId
        })

        expect(state.chats.U333333.messages).toEqual([
          {
            senderId: userId,
            recipientId: partnerId,
            message: 'hello'
          }
        ])
      })

      it('should increment `numOfNewMessages` when `message.height > state.lastMessageHeight`', () => {
        const state = {
          chats: {
            U111111: {
              messages: [],
              numOfNewMessages: 0
            }
          },
          lastMessageHeight: 1
        }

        const userId = 'U123456' // my address
        const partnerId = 'U111111' // partner address

        // message 1
        mutations.pushMessage(state, {
          message: {
            senderId: partnerId,
            recipientId: userId,
            message: 'message 1',
            height: 2
          },
          userId
        })

        expect(state.chats.U111111.numOfNewMessages).toBe(1)

        // message 2
        mutations.pushMessage(state, {
          message: {
            senderId: partnerId,
            recipientId: userId,
            message: 'message 2',
            height: 2
          },
          userId
        })

        expect(state.chats.U111111.numOfNewMessages).toBe(2)
      })

      it('should not increment `numOfNewMessages` when `state.lastMessageHeight === 0`', () => {
        const state = {
          chats: {
            U111111: {
              messages: [],
              numOfNewMessages: 0
            }
          },
          lastMessageHeight: 0
        }

        const userId = 'U123456' // my address
        const partnerId = 'U111111' // partner address

        mutations.pushMessage(state, {
          message: {
            senderId: partnerId,
            recipientId: userId,
            message: 'message 1',
            height: 2
          },
          userId
        })

        expect(state.chats.U111111.numOfNewMessages).toBe(0)
      })
    })

    /**
     * mutations.markAsRead
     */
    describe('mutations.markAsRead', () => {
      it('should reset `chat.numOfNewMessages`', () => {
        const state = {
          chats: {
            U123456: {
              numOfNewMessages: 100
            }
          }
        }

        mutations.markAsRead(state, 'U123456')

        expect(state.chats.U123456.numOfNewMessages).toBe(0)
      })
    })

    /**
     * mutations.markAllAsRead
     */
    describe('mutations.markAllAsRead', () => {
      it('should reset `chat.numOfNewMessages` for all chats', () => {
        const state = {
          chats: {
            U111111: {
              numOfNewMessages: 100
            },
            U222222: {
              numOfNewMessages: 200
            }
          }
        }

        mutations.markAllAsRead(state)

        expect(state.chats.U111111.numOfNewMessages).toBe(0)
        expect(state.chats.U222222.numOfNewMessages).toBe(0)
      })
    })

    /**
     * mutations.updateMessage
     */
    describe('mutations.updateMessage', () => {
      it('should update `message.id` & `message.status`', () => {
        const partnerId = 'U123456'
        const messages = [
          {
            id: 'localId1',
            status: 'sent'
          },
          {
            id: 'localId2',
            status: 'sent'
          }
        ]
        const state = {
          chats: {
            [partnerId]: {
              messages
            }
          }
        }

        // update message 1
        mutations.updateMessage(state, {
          partnerId,
          id: 'localId1',
          realId: 'realId1',
          status: 'confirmed'
        })

        // update message 2
        mutations.updateMessage(state, {
          partnerId,
          id: 'localId2',
          realId: 'realId2',
          status: 'confirmed'
        })

        expect(messages).toEqual([
          {
            id: 'realId1',
            status: 'confirmed'
          },
          {
            id: 'realId2',
            status: 'confirmed'
          }
        ])
      })
    })
  })

  /**
   * Test actions.
   */
  describe('actions', () => {
    /**
     * actions.loadChats
     */
    describe('actions.loadChats', () => {
      it('should commit and dispatch after success response', async () => {
        // mock & replace `getChats` dependency
        chatModule.__Rewire__('getChats', () => Promise.resolve({
          messages: [],
          lastMessageHeight: 100
        }))

        const state = {
          lastMessageHeight: 0
        }

        const commit = sinon.spy()
        const dispatch = sinon.spy()

        await actions.loadChats({ state, commit, dispatch })

        expect(commit.args).toEqual([
          ['setFulfilled', false],
          ['setHeight', 100],
          ['setFulfilled', true]
        ])

        expect(dispatch.args).toEqual([
          ['pushMessages', []]
        ])
      })
    })

    /**
     * actions.pushMessages
     */
    describe('actions.pushMessages', () => {
      it('should commit(pushMessage) n times', () => {
        const commit = sinon.spy()
        const rootState = {
          address: 'U123456'
        }
        const messages = [{}, {}, {}] // 3 times

        actions.pushMessages({ commit, rootState }, messages)

        expect(commit.callCount).toBe(3)
      })

      it('should commit(pushMessage) 0 times', () => {
        const commit = sinon.spy()
        const rootState = {
          address: 'U123456'
        }
        const messages = []

        actions.pushMessages({ commit, rootState }, messages)

        expect(commit.callCount).toBe(0)
      })
    })

    /**
     * actions.createChat
     */
    describe('actions.createChat', () => {
      it('should throw error when invalid user address', async () => {
        const promise = actions.createChat({ commit: null }, {
          partnerId: 'invalid user id'
        })

        await expect(promise).rejects.toEqual(new Error('Invalid user address'))
      })

      it('should resolve and create chat without `partnerName`', async () => {
        // mock & replace `admApi.getPublicKey` dependency
        chatModule.__Rewire__('admApi', {
          getPublicKey: () => Promise.resolve('public key')
        })

        const partnerId = 'U111111'

        const commit = sinon.spy()

        await expect(actions.createChat({ commit }, { partnerId })).resolves.toEqual('public key')

        expect(commit.args).toEqual([
          ['createEmptyChat', partnerId]
        ])
      })

      it('should resolve and create chat with `partnerName`', async () => {
        // mock & replace `admApi.getPublicKey` dependency
        chatModule.__Rewire__('admApi', {
          getPublicKey: () => Promise.resolve('public key')
        })

        const partnerId = 'U111111'
        const partnerName = 'Rick Sanchez'

        const commit = sinon.spy()

        await expect(actions.createChat({ commit }, { partnerId, partnerName })).resolves.toEqual('public key')

        expect(commit.args).toEqual([
          ['partners/displayName', { partner: partnerId, displayName: partnerName }, { root: true }],
          ['createEmptyChat', partnerId]
        ])
      })
    })

    /**
     * actions.sendMessage
     */
    describe('actions.sendMessage', () => {
      const userId = 'U111111'
      const recipientId = 'U222222'
      const message = 'hello world'

      it('should update message status when rejected', async () => {
        const messageObject = {
          id: '1',
          message: 'hello world',
          status: 'sent'
        }

        // mock & replace `createMessage` & `queueMessage` dependency
        chatModule.__Rewire__('createMessage', () => messageObject)
        chatModule.__Rewire__('queueMessage', () => Promise.reject(new Error('Message rejected')))

        const commit = sinon.spy()
        const rootState = {
          address: userId
        }

        const promise = actions.sendMessage({ commit, rootState }, { message, recipientId })
        await expect(promise).rejects.toEqual(new Error('Message rejected'))

        expect(commit.args).toEqual([
          ['pushMessage', { message: messageObject, userId }],
          ['updateMessage', {
            id: messageObject.id,
            status: 'rejected',
            partnerId: recipientId
          }]
        ])
      })

      it('should update message status to confirmed', async () => {
        const messageObject = {
          id: '1',
          message: 'hello world',
          status: 'sent'
        }

        // mock & replace `createMessage` & `queueMessage` dependency
        chatModule.__Rewire__('createMessage', () => messageObject)
        chatModule.__Rewire__('queueMessage', () => Promise.resolve({ success: true, transactionId }))

        const commit = sinon.spy()
        const rootState = {
          address: userId
        }

        const transactionId = 't1'
        const promise = actions.sendMessage({ commit, rootState }, { message, recipientId })
        await expect(promise).resolves.toEqual({ success: true, transactionId })

        expect(commit.args).toEqual([
          ['pushMessage', { message: messageObject, userId }],
          ['updateMessage', {
            id: messageObject.id,
            realId: transactionId,
            status: 'confirmed',
            partnerId: recipientId
          }]
        ])
      })
    })
  })
})
