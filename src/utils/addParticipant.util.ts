import retry from 'async-retry';
import client from "../twilioClient";
import { ParticipantInstance, ParticipantListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation/participant";

export const addParticipant = async (
  conversationSid: string,
  participant: ParticipantListInstanceCreateOptions
) : Promise<ParticipantInstance> => {
  return retry(async () => {
    try {
      const createdParticipant = await client.conversations
        .conversations(conversationSid)
        .participants
        .create(participant)
      console.log({createdParticipant})
      return createdParticipant
    } catch (err) {
      console.log('Create participant err', err);
      throw new Error(err)
    }
  })
}