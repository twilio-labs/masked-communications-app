import { listParticipantConversations } from "../../src/utils";
import client from '../../src/twilioClient';
import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation'

jest.mock('../../src/twilioClient')
let mockedClient = jest.mocked(client, true)

describe('ListParticipantConversations util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  it('it lists conversations based on participant number', async () => {
    const createSpy = jest.fn((options) => { return options })
    mockedClient['conversations'] = {
      participantConversations: {
        list: (options) => createSpy(options)
      }
    } as any

    const result = await listParticipantConversations("+1234");
    expect(createSpy).toBeCalledWith({"address":"+1234"});
    expect(result).not.toBeNull();
    // ToDo: add proper mocked response with ParticipantConversationInstance
  })


  it('calls quit if error is not a 429 retry', async () => {
    mockedClient['conversations'] = {
      participantConversations: {
        list: (options) => {
          throw new Error('Twilio Problem') 
        }
      }
    } as any

    const consoleSpy = jest.spyOn(console, 'log');

    try {
      await listParticipantConversations("+1234");
    } catch (e) {
      expect(consoleSpy).toHaveBeenCalledWith('Quit without retry');
    }
  })


  it('throws error to retry on 429 status code', async () => {

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
      participantConversations: {
        list: (options) => {
          throw new TwilioError('Too many requests')
        }
      }
    } as any

    const consoleSpy = jest.spyOn(console, 'log');

    try {
      await listParticipantConversations(
        "+1234",
        { retries: 0, factor: 1, maxTimeout: 0, minTimeout: 0 });
    } catch (e) {
      expect(consoleSpy).toHaveBeenCalledWith('Re-trying on 429 error');
    }
  })

})