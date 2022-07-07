import { ConversationInstance } from "twilio/lib/rest/conversations/v1/conversation";
import { SessionPostBody } from "../@types/session.types"; 
import client from "../twilioClient";

export const createConversation = async (options: SessionPostBody) : Promise<ConversationInstance> => {
  return await client.conversations.conversations
    .create(options)
    .then((c) => { return c })
    .catch((err) => { throw `createConversation: ${err}` });
}