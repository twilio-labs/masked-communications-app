import retry from 'async-retry';
import client from "../twilioClient";
import { ParticipantInstance, ParticipantListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation/participant";
import { retryConfig } from '../config/retry.config';

export const addParticipant = async (
  conversationSid: string,
  participant: ParticipantListInstanceCreateOptions,
  retryOptions = retryConfig
) : Promise<ParticipantInstance> => {
  return retry(async (quit) => {
    try {
      const createdParticipant = await client.conversations
        .conversations(conversationSid)
        .participants
        .create(participant)

      return createdParticipant
    } catch (err) {
      if (err.status !== 429) {
        console.log('Quit without retry')
        quit(new Error(err));
        return;
      }

      console.log('Re-trying on 429 error');
      throw new Error(err);
    }
  }, retryOptions)
}