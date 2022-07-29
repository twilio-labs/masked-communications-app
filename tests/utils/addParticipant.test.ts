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

    let createSpy = jest.fn((options) => { return options });
    let participantsSpy = jest.fn(() => { return  {create:createSpy}});
    const conversationsSpy = jest.fn((options) => { return participantsSpy });

    mockedClient['conversations'] = {
        conversations: conversationsSpy
    } as any


    const result = await addParticipant("myConversationSid", mockParticipant );
    expect(conversationsSpy).toBeCalledWith("myConversationSid");
    expect(participantsSpy).toBeCalled();
    expect(createSpy).toBeCalledWith(mockParticipant);
    expect(result).not.toBeNull();

  })


})