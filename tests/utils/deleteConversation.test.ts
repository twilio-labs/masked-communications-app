
import client from '../../src/twilioClient'
import { deleteConversation } from '../../src/utils'
jest.mock('../../src/twilioClient')

describe('deleteConversation util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('it deletes conversation', async () => {
    const mockedClient = jest.mocked(client, true)

    const removeSpy = jest.fn(() => {
      return true
    })

    const conversationsSpy = jest.fn((options) => {
      return {
        remove: removeSpy
      }
    })

    mockedClient.conversations = {
      conversations: conversationsSpy
    } as any

    const result = await deleteConversation('myConversationSid')
    expect(result).toBe(true)

    expect(conversationsSpy).toBeCalledWith('myConversationSid')
    expect(removeSpy).toBeCalled()
  })

  it('throws an error if Twilio client throws', async () => {
    const mockedClient = jest.mocked(client, true)

    const removeSpy = jest.fn(() => {
      throw new Error('Twilio Problem')
    })

    const conversationsSpy = jest.fn((options) => {
      return {
        remove: removeSpy
      }
    })

    mockedClient.conversations = {
      conversations: conversationsSpy
    } as any

    const consoleSpy = jest.spyOn(console, 'log')

    try {
      await deleteConversation('myConversationSid')
    } catch (e) {
      console.log(e)
    }

    expect(consoleSpy).toHaveBeenCalledWith('Quit without retry')
  })

  it('retrys if error is 429', async () => {
    class TwilioError extends Error {
      status: number

      constructor (message) {
        super(message)
        this.name = 'ConcurrencyLimit'
        this.status = 429
      }
    }

    const mockedClient = jest.mocked(client, true)

    const removeSpy = jest.fn(() => {
      throw new TwilioError('Too many connections')
    })

    const conversationsSpy = jest.fn((options) => {
      return {
        remove: removeSpy
      }
    })

    mockedClient.conversations = {
      conversations: conversationsSpy
    } as any

    const consoleSpy = jest.spyOn(console, 'log')

    try {
      await deleteConversation('myConversationSid', { retries: 0, factor: 1, maxTimeout: 0, minTimeout: 0 })
    } catch (e) {
      console.log(e)
    }

    expect(consoleSpy).toHaveBeenCalledWith('Re-trying on 429 error')
  })
})
