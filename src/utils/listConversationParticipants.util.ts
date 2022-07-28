import retry from 'async-retry'
import { ParticipantInstance } from 'twilio/lib/rest/conversations/v1/conversation/participant'
import client from '../twilioClient'

export const listConversationParticipants = async (conversation: string) : Promise<ParticipantInstance[]> => {
  return retry(async (quit) => {
    try {
      const participants = await client.conversations
        .conversations(conversation)
        .participants
        .list()

      return participants
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