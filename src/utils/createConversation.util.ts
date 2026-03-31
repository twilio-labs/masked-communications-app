import { ConversationInstance } from 'twilio/lib/rest/conversations/v1/conversation'
import { SessionPostBody } from '../@types/types'
import client from '../twilioClient'

import retry from 'async-retry'
import { retryConfig } from '../config/retry.config'

export const createConversation = async (options: SessionPostBody, retryOptions = retryConfig) : Promise<ConversationInstance> => {
  return retry(async (quit) => {
    try {
      return await client.conversations.conversations.create(options)
    } catch (err: any) {
      if (err.status !== 429) {
        console.log('Quit without retry')
        console.log(err)
        quit(new Error('Quit without retry'))
        throw new Error(String(err))
      }

      console.log('Re-trying on 429 error')
      throw new Error(String(err))
    }
  }, retryOptions)
}
