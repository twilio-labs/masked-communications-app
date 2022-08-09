import { ConversationInstance } from 'twilio/lib/rest/conversations/v1/conversation'
import { SessionPostBody } from '../@types/types'
import client from '../twilioClient'

import retry from 'async-retry'
import { retryConfig } from '../config/retry.config'

export const createConversation = async (options: SessionPostBody, retryOptions = retryConfig) : Promise<ConversationInstance> => {
  return retry(async (quit) => {
    try {
      return client.conversations.conversations.create(options)
    } catch (err) {
      if (err.status !== 429) {
        console.log('Quit without retry')
        console.log(err)
        quit(new Error('Quit without retry'))
        return
      }

      console.log('Re-trying on 429 error')
      throw new Error(err)
    }
  }, retryOptions)
}
