import retry from 'async-retry'
import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation'
import client from '../twilioClient'

export const listParticipantConversations = async (phoneNumber: string) : Promise<ParticipantConversationInstance[]> => {
  const activeConversations = await client.conversations.participantConversations.list({address: phoneNumber})
  return activeConversations
}