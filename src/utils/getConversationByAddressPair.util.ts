import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation';
import client from '../twilioClient'

export const getConversationByAddressPair = async (address: string, proxyAddress: string) : Promise<ParticipantConversationInstance> => {
  if (address === undefined) {
    throw "getOpenConversationsForAddressPair: address is missing";
  }
  const params = { address: address };

  const participantConversations = await client.conversations.participantConversations.list(params);
  const conversation = participantConversations.find(p => {
    if (p.conversationState !== 'closed' && p.participantMessagingBinding.proxy_address === proxyAddress) {
      console.log(`Found a non-closed conversation ${p.conversationSid} with proxy address ${p.participantMessagingBinding.proxy_address} for address ${address}`);
      return p;
    }
  });

  return conversation;
}