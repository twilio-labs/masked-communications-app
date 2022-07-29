
import client from '../../src/twilioClient'
jest.mock('../../src/twilioClient')
import { deleteConversation } from "../../src/utils";


describe('deleteConversation util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  it('it deletes conversation', async () => {
    let mockedClient = jest.mocked(client, true)

    let removeSpy = jest.fn(() => {
      return true
    })

    let conversationsSpy = jest.fn((options) => {
      return {
        remove: removeSpy
      }
    })
    
    mockedClient['conversations'] = {
      conversations: conversationsSpy
    } as any

    const result = await deleteConversation("myConversationSid")
    expect(result).toBe(true)
    
    expect(conversationsSpy).toBeCalledWith("myConversationSid")
    expect(removeSpy).toBeCalled()
  })

  it('throws an error if Twilio client throws', async () => {
    let mockedClient = jest.mocked(client, true)

    let removeSpy = jest.fn(() => {
      throw new Error('Twilio Problem')
    })

    let conversationsSpy = jest.fn((options) => {
      return {
        remove: removeSpy
      }
    })
    
    mockedClient['conversations'] = {
      conversations: conversationsSpy
    } as any

    const consoleSpy = jest.spyOn(console, 'log');

    try {
      await deleteConversation("myConversationSid");
    } catch (e) {
      expect(consoleSpy).toHaveBeenCalledWith('Quit without retry');
    }
  })

  it('retrys if error is 429', async () => {
    interface TwilioError extends Error {
      status: number
    }

    class TwilioError extends Error {
      constructor(message) {
        super(message);
        this.name = "ConcurrencyLimit";
        this.status = 429
      }
    }
    
    let mockedClient = jest.mocked(client, true)

    let removeSpy = jest.fn(() => {
      throw new TwilioError('Too many connections')
    })

    let conversationsSpy = jest.fn((options) => {
      return {
        remove: removeSpy
      }
    })
    
    mockedClient['conversations'] = {
      conversations: conversationsSpy
    } as any

    const consoleSpy = jest.spyOn(console, 'log');

    try {
      await deleteConversation("myConversationSid",  { retries: 0, factor: 1, maxTimeout: 0, minTimeout: 0 });
    } catch (e) {
      expect(consoleSpy).toHaveBeenCalledWith('Re-trying on 429 error');
    }
  })
})