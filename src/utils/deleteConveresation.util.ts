import client from "../twilioClient";

export const deleteConversation = async (conversationSid: string) : Promise<boolean> => {
  return client.conversations
    .conversations(conversationSid)
    .remove()
    .then((c) => { return c })
    .catch((err) => { throw err })
}