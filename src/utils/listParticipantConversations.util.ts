import retry from 'async-retry'
import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation'
import client from '../twilioClient'
import { retryConfig } from "../config/retry.config";

export const listParticipantConversations = async (phoneNumber: string, retryOptions = retryConfig) : Promise<ParticipantConversationInstance[]> => {
  return retry(async (quit) => {
    try {
      const activeConversations = await client.conversations.participantConversations.list({address: phoneNumber})
      return activeConversations
    } catch (err) {
      if (err.status !== 429) {
        console.log('Quit without retry')
        console.log(err)
        quit(new Error('Quit without retry'));
        return;
      }

      console.log('Re-trying on 429 error');
      throw new Error(err);
    }
  }, retryOptions)

}