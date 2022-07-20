import * as session from '../src/services/session.service';
import client from '../src/twilioClient'
import { ParticipantInstance, ParticipantListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation/participant";
require('dotenv').config()

test("it should not find any open conversations for empty proxy address", async () => {
  const res = await session.matchAvailableProxyAddresses({});
  return expect(res).toEqual({});
});

describe('It should find only active conversation', () => {
  const phoneNumbers: Array<any> = JSON.parse(process.env.NUMBER_POOL).sort()

  beforeAll( async () => {
    // TODO delete all conversations ie start fresh
  });

  test("It should not find nay active conversations because this address doesnt have any", async ()=>{
    const res = await session.getActiveProxyAddresses(['+19252148000']);
    return expect(res).toEqual({'+19252148000':[]});
  });

  test("It should not find the non active conversations", async ()=>{
    const res = await session.getActiveProxyAddresses(['+19252148007']);
    return expect(res).toEqual({'+19252148007':[]});
  });

  describe('It should find only the active conversations', () =>{
    let conversationSid;
    beforeAll( async () => {
      // Create a open conversation with participant  
      const conversation = await client.conversations.conversations.create();
      conversationSid = conversation.sid;

      const p : ParticipantListInstanceCreateOptions = {
          messagingBinding: {
            address: '+19252148007',
            proxyAddress: phoneNumbers[0]
          }
      }
      return await client.conversations.conversations(conversationSid).participants.create(p);
    });

    afterAll( async () => {
      return await client.conversations.conversations(conversationSid).remove();
    });

    test("It should find only active conversations even if address has closed ones", async ()=>{
      const res = await session.getActiveProxyAddresses(['+19252148007']);
      return expect(res).toEqual({'+19252148007': [phoneNumbers[0]]});
    });  
  });
});

test("Creates a conversation", ()=>{
  expect(true).toBe(true)
});