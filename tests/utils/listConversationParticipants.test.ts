import { listConversationParticipants } from '../../src/utils'
import client from '../../src/twilioClient'

jest.mock('../../src/twilioClient')
const mockedClient = jest.mocked(client, true)

describe('listConversationParticipants', () => {
  it('it lists participants with provided conversation sid', async () => {
    const listSpy = jest.fn(() => { return ['fake_participant_1', 'fake_participant_2'] })

    const conversationSpy = jest.fn((options) => {
      return {
        participants: {
          list: listSpy
        }
      }
    })

    mockedClient.conversations = {
      conversations: conversationSpy
    } as any

    const result = await listConversationParticipants('CH123')

    expect(conversationSpy).toBeCalledWith('CH123')
    expect(listSpy).toBeCalled()
    expect(result).toEqual(['fake_participant_1', 'fake_participant_2'])
  })

  it('should throw error if Twilio client throws', async () => {
    const listSpy = jest.fn(() => { throw new Error('Participant List Error') })

    const conversationSpy = jest.fn((options) => {
      return {
        participants: {
          list: listSpy
        }
      }
    })

    mockedClient.conversations = {
      conversations: conversationSpy
    } as any

    await expect(listConversationParticipants('CH123'))
      .rejects
      .toThrowError('Participant List Error')
  })

  it('should retry if Twilio client throws a 429 error', async () => {
    class TwilioError extends Error {
      status: number

      constructor (message) {
        super(message)
        this.name = 'ConcurrencyLimit'
        this.status = 429
      }
    }

    const listSpy = jest.fn(() => { throw new TwilioError('Error to Retry') })

    const conversationSpy = jest.fn((options) => {
      return {
        participants: {
          list: listSpy
        }
      }
    })

    mockedClient.conversations = {
      conversations: conversationSpy
    } as any

    const consoleSpy = jest.spyOn(console, 'log')

    try {
      await listConversationParticipants('CH123', { retries: 0, factor: 1, maxTimeout: 0, minTimeout: 0 })
    } catch (e) {
      console.log(e)
    }

    expect(consoleSpy).toBeCalledWith('Re-trying on 429 error')
  })
})
