import retry from 'async-retry'
import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation'
import client from '../twilioClient'

export const listParticipantConversations = async (phoneNumber: string) : Promise<ParticipantConversationInstance[]> => {
  try {
    const activeConversations = await client.conversations.participantConversations.list({address: phoneNumber})
    return activeConversations
  } catch (err) {
    console.log(phoneNumber, err)
    throw new Error(err)
  }
}