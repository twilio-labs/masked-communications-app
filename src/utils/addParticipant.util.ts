import { ConversationParticipant } from "../@types/session.types";
import retry from 'async-retry';
import client from "../twilioClient";
import { ParticipantListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation/participant";

export const addParticipant = (conversationSid: string, participant: ParticipantListInstanceCreateOptions) => {
  return retry(async () => {
    try {
      const createdParticipant = await client.conversations
        .conversations(conversationSid)
        .participants
        .create(participant)
      return createdParticipant
    } catch (err) {
      throw err
    }
  })
}