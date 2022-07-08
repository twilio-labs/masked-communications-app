import { ConversationInstance } from "twilio/lib/rest/conversations/v1/conversation";
import { SessionPostBody } from "../@types/session.types"; 
import client from "../twilioClient";

import retry from 'async-retry';

export const createConversation = async (options: SessionPostBody) : Promise<ConversationInstance> => {
  return retry(async () => {
    try {
      const conversation = await client.conversations.conversations.create(options);
      return conversation;
    } catch (err) {
      throw `createConversation: ${err}`;
    }
  })
}