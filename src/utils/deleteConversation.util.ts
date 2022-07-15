import client from "../twilioClient"

import retry from 'async-retry'

export const deleteConversation = async (conversationSid: string) : Promise<boolean> => {
  return retry(async() => {
    try {
      await client.conversations.conversations(conversationSid).remove()
      return true
    } catch (err) {
      throw err
    } 
  })
}