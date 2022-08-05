import { getConversationByAddressPair } from "../../src/utils";
import client from '../../src/twilioClient';

jest.mock('../../src/twilioClient')
let mockedClient = jest.mocked(client, true)

describe('GetConversationByAddressPair util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  it('it gets Conversation by address pair, excluding closed conversations', async () => {
    const mockParticipants = [{
      conversationState: "closed",
      conversationSid: "myClosedConversationSid",
      participantMessagingBinding: {
        proxy_address: "+0000" 
      }
    }, {
      conversationState: "open",
      conversationSid: "myClosedConversationSid",
      participantMessagingBinding: {
        proxy_address: "+0000" 
      }
    }, {
      conversationState: "open",
      conversationSid: "myOpenConversationSid",
      participantMessagingBinding: {
        proxy_address: "+5678" 
      }
    }]

    const listSpy = jest.fn((options) => { return mockParticipants })
    mockedClient['conversations'] = {
      v1:{
        participantConversations: {
          list: (options) => listSpy(options)
        }
      }
    } as any

    const result = await getConversationByAddressPair("+1234","+5678");
    expect(listSpy).toBeCalledWith({"address":"+1234"});
    expect(result).toEqual({conversationSid: "myOpenConversationSid", conversationState: "open", participantMessagingBinding: {proxy_address: "+5678"}});
    // ToDo: add proper mocked response with ParticipantConversationInstance
  })

  it("should throw error if Twilio client throws", async () => {
    const createSpy = jest.fn((options) => { throw new Error('Twilio Problem') })
    mockedClient['conversations'] = {
      v1:{
        participantConversations: {
          list: (options) => createSpy(options)
        }
      }
    } as any

    await expect(getConversationByAddressPair("bad input", "worse input"))
      .rejects
      .toThrowError('Error: Twilio Problem')
  })

  it("should retry if Twilio error is 429", async () => {

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

      mockedClient['conversations'] = {
        v1:{
          participantConversations: {
            list: (options) => {
              throw new TwilioError('Too many requests')
            }
          }
        }
      } as any
  
      const consoleSpy = jest.spyOn(console, 'log');
  
      try {
        await getConversationByAddressPair("+1234", "+5678", { retries: 0, factor: 1, maxTimeout: 0, minTimeout: 0 });
      } catch (e) {
        console.log(e)
      }

      expect(consoleSpy).toHaveBeenCalledWith('Re-trying on 429 error');
  })
})

