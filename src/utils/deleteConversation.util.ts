import client from "../twilioClient"

import retry from 'async-retry'

export const deleteConversation = async (conversationSid: string) : Promise<boolean> => {
  return retry(async(quit) => {
    try {
      await client.conversations.conversations(conversationSid).remove()
      return true
    } catch (err) {
      if (err.status !== 429) {
        quit(new Error(err));
        return;
      }

      console.log('Re-trying on 429 error');
      throw new Error(err);
    } 
  })
}