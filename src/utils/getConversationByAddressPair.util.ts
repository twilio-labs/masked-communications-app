import { ParticipantConversationInstance } from 'twilio/lib/rest/conversations/v1/participantConversation'
import retry from 'async-retry'
import client from '../twilioClient'
import { retryConfig } from '../config/retry.config'

export const getConversationByAddressPair = async (address: string, proxyAddress: string, retryOptions = retryConfig) : Promise<ParticipantConversationInstance> => {
  return retry(async (quit) => {
    try {
      const participantConversations = await client.conversations.v1
        .participantConversations
        .list({ address })

      const conversation = participantConversations.find(p => {
        return p.conversationState !== 'closed' && p.participantMessagingBinding.proxy_address === proxyAddress
      })
      return conversation
    } catch (err) {
      if (err.status !== 429) {
        quit(new Error(err))
        return
      }

      console.log('Re-trying on 429 error')
      throw new Error(err)
    }
  }, retryOptions)
}
