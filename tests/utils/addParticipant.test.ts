import { addParticipant } from "../../src/utils";
import client from '../../src/twilioClient';

import { ParticipantInstance, ParticipantListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation/participant";


jest.mock('../../src/twilioClient')
let mockedClient = jest.mocked(client, true)

const mockParticipant: Partial<ParticipantListInstanceCreateOptions> = {
  identity: "+1234",
}

describe('addParticipant util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

   
  it('it adds participant to conversation', async () => {
    let createSpy = jest.fn((options) => { return mockParticipant })
    const conversationsSpy = jest.fn((options) => {
      return {
        participants: { create: createSpy }
      }
    });

    mockedClient['conversations'] = {
        conversations: conversationsSpy
    } as any


    const result = await addParticipant("myConversationSid", mockParticipant );
    expect(conversationsSpy).toBeCalledWith("myConversationSid");
    expect(createSpy).toBeCalledWith(mockParticipant);
    expect(result).not.toBeNull();
  })

  it('calls quit if error is not a 429 retry', async () => {
    let createSpy = jest.fn((options) => { throw new Error('Twilio Problem') })
    const conversationsSpy = jest.fn((options) => {
      return {
        participants: { create: createSpy }
      }
    });

    mockedClient['conversations'] = {
        conversations: conversationsSpy
    } as any

    const consoleSpy = jest.spyOn(console, 'log');

    try {
      await addParticipant("myConversationSid", mockParticipant );
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

    let createSpy = jest.fn((options) => { throw new TwilioError('Concurrency Limit') })
    const conversationsSpy = jest.fn((options) => {
      return {
        participants: { create: createSpy }
      }
    });

    mockedClient['conversations'] = {
        conversations: conversationsSpy
    } as any

    const consoleSpy = jest.spyOn(console, 'log');

    try {
      await addParticipant("myConversationSid", mockParticipant, { retries: 0, factor: 1, maxTimeout: 0, minTimeout: 0 });
    } catch (e) {
      expect(consoleSpy).toHaveBeenCalledWith('Re-trying on 429 error');
    }
  })
})