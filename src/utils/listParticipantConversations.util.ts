import retry from 'async-retry'
import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation'
import client from '../twilioClient'

export const listParticipantConversations = async (phoneNumber: string) : Promise<ParticipantConversationInstance[]> => {
  return retry(async (quit) => {
    try {
      const activeConversations = await client.conversations.participantConversations.list({address: phoneNumber})
      return activeConversations
    } catch (err) {
      if (err.status !== 429) {
        quit(new Error(err));
        return;
      }

      console.log('Re-trying on 429 error');
      throw new Error(err);
    }
  })

}