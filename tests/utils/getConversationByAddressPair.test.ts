import { getConversationByAddressPair } from "../../src/utils";
import client from '../../src/twilioClient';
import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation';

jest.mock('../../src/twilioClient')
let mockedClient = jest.mocked(client, true)

describe('GetConversationByAddressPair util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  it('it gets Conversation by address pair', async () => {
    const mockParticipants = [{
      conversationState: "closed",
      conversationSid: "myConversationSid",
      participantMessagingBinding: {
        proxy_address: "+5678" 
      }
    }]

    const createSpy = jest.fn((options) => { return mockParticipants })
    mockedClient['conversations'] = {
      v1:{
        participantConversations: {
          list: (options) => createSpy(options)
        }
      }
    } as any

    const result = await getConversationByAddressPair("+1234","+5678");
    expect(createSpy).toBeCalledWith({"address":"+1234"});
    expect(result).not.toBeNull();
    // ToDo: add proper mocked response with ParticipantConversationInstance
  })
})

