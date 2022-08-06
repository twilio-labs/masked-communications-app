import client from "../twilioClient"

import retry from 'async-retry'
import { retryConfig } from "../config/retry.config"

export const deleteConversation = async (conversationSid: string, retryOptions = retryConfig) : Promise<boolean> => {
  return retry(async(quit) => {
    try {
      await client.conversations.conversations(conversationSid).remove()
      return true
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